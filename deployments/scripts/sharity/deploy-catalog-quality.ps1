param(
    [ValidateSet('authorization-server', 'marketplace-service', 'sharity-app', 'sharity-admin-portal')]
    [string[]]$Components = @('authorization-server', 'marketplace-service', 'sharity-app', 'sharity-admin-portal')
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$state = Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$testReport = Get-Content (Join-Path $workspace 'outputs/quality-verified-results.json') -Raw | ConvertFrom-Json
if ($testReport.stats.unexpected -ne 0 -or $testReport.stats.expected -lt 300) { throw 'All browser regression scenarios must have a passing final result before rollout.' }
$boundaries = Get-Content (Join-Path $workspace 'outputs/quality-boundaries.json') -Raw | ConvertFrom-Json
if (($boundaries.stats.expected + $boundaries.stats.unexpected) -lt 33) { throw 'The full feature-boundary run is required before rollout.' }
$adminAudit = Get-Content (Join-Path $workspace 'outputs/quality-admin-audit.json') -Raw | ConvertFrom-Json
if ($adminAudit.Count -lt 26 -or @($adminAudit | Where-Object { $_.overflow -or $_.errors.Count -gt 0 }).Count) { throw 'Admin screen audit must pass before rollout.' }
$images = @{
    'authorization-server' = "authorization-server:release-$($state.release)"
    'marketplace-service' = "marketplace-service:release-$($state.release)"
    'sharity-app' = "sharity-app:release-$($state.release)"
    'sharity-admin-portal' = 'sharity-admin-portal:latest'
}
$compose = @('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
function Docker-Step([string[]]$Arguments, [string]$Name) {
    $process = Start-Process docker.exe -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/quality-deploy-$Name.log") -RedirectStandardError (Join-Path $workspace "outputs/quality-deploy-$Name.err.log")
    if ($process.ExitCode -ne 0) { throw "Deployment step failed: $Name" }
}
function Assert-FreshArtifact([string]$Artifact, [string]$SourceDirectory) {
    $artifactItem = Get-Item -LiteralPath $Artifact
    $newer = @(Get-ChildItem -LiteralPath $SourceDirectory -Recurse -File | Where-Object LastWriteTimeUtc -GT $artifactItem.LastWriteTimeUtc)
    if ($newer.Count) { throw "Artifact is older than its sources: $Artifact" }
}
$jar = Join-Path $workspace 'marketplace-service/target/marketplace-service-0.0.1-SNAPSHOT.jar'
Assert-FreshArtifact $jar (Join-Path $workspace 'marketplace-service/src/main')
$authJar = Join-Path $workspace 'authorization-server/target/authorization-server-0.0.1-SNAPSHOT.jar'
Assert-FreshArtifact $authJar (Join-Path $workspace 'authorization-server/src/main')
$bundle = Get-ChildItem (Join-Path $workspace 'sharity-app-ui/dist-e2e/_expo/static/js/web') -Filter 'index-*.js' | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
Assert-FreshArtifact $bundle.FullName (Join-Path $workspace 'sharity-app-ui/src')
if ((Get-FileHash -Algorithm SHA256 $bundle.FullName).Hash.ToLowerInvariant() -ne $testReport.bundleSha256) { throw 'The verified web bundle changed after testing.' }
$adminBundle = Get-ChildItem (Join-Path $workspace 'sharity-admin-portal/dist/assets') -Filter '*.js' | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
Assert-FreshArtifact $adminBundle.FullName (Join-Path $workspace 'sharity-admin-portal/src')
$rollback = @{}
$stamp = Get-Date -Format yyyyMMdd-HHmmss
foreach ($component in $components) {
    $previous = docker inspect --format '{{.Image}}' "sharity-local-$component-1"
    if ($LASTEXITCODE -ne 0) { throw "Cannot preserve running $component image" }
    $rollback[$component] = "${component}:before-catalog-quality-$stamp"
    Docker-Step @('tag', $previous, $rollback[$component]) "preserve-$component"
}
$rollbackRecord = @{ rollback = $rollback; targetImages = $images; time = $stamp } | ConvertTo-Json -Depth 5
$rollbackRecord | Set-Content (Join-Path $workspace "outputs/quality-deployment-rollback-$stamp.json")
$rollbackRecord | Set-Content (Join-Path $workspace 'outputs/quality-deployment-rollback.json')
Docker-Step @('build','-t',$images['marketplace-service'],'-f',(Join-Path $deploy 'dockerfiles/verified-java.Dockerfile'),(Join-Path $workspace 'marketplace-service')) 'build-marketplace'
Docker-Step @('build','-t',$images['authorization-server'],'-f',(Join-Path $deploy 'dockerfiles/verified-java.Dockerfile'),(Join-Path $workspace 'authorization-server')) 'build-auth'
Docker-Step @('build','--build-context',"deployment=$deploy",'-t',$images['sharity-app'],'-f',(Join-Path $deploy 'dockerfiles/verified-web.Dockerfile'),(Join-Path $workspace 'sharity-app-ui')) 'build-storefront'
Docker-Step @('build','--build-context',"deployment=$deploy",'-t',$images['sharity-admin-portal'],'-f',(Join-Path $deploy 'dockerfiles/verified-admin.Dockerfile'),(Join-Path $workspace 'sharity-admin-portal')) 'build-admin'
try {
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build') + $components) 'up'
    $ready = $false
    for ($attempt = 0; $attempt -lt 36; $attempt++) {
        $backend = docker inspect --format '{{.State.Health.Status}}' sharity-local-marketplace-service-1
        $web = docker inspect --format '{{.State.Health.Status}}' sharity-local-sharity-app-1
        $auth = docker inspect --format '{{.State.Health.Status}}' sharity-local-authorization-server-1
        if ($backend -eq 'healthy' -and $web -eq 'healthy' -and $auth -eq 'healthy') { $ready = $true; break }
        Start-Sleep -Seconds 5
    }
    if (-not $ready) { throw 'Updated backend and storefront did not become healthy.' }
    Docker-Step @('exec','sharity-local-sharity-admin-portal-1','wget','-qO-','http://127.0.0.1:8080/index.html') 'admin-health'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-t') 'nginx-check'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload'
    $catalog = Invoke-RestMethod 'http://localhost:8080/bff/public/marketplace-service/api/v1/marketplace/listings'
    $image = Invoke-WebRequest -UseBasicParsing -Uri ("http://localhost:8080/bff/public" + $catalog[0].imageUrl) -TimeoutSec 30
    if ($image.StatusCode -ne 200 -or $image.Headers['Content-Type'] -notmatch '^image/') { throw 'Live listing image smoke failed.' }
    Write-Output 'Selected Sharity components deployed; live listing image passed.'
} catch {
    foreach ($component in $components) { Docker-Step @('tag',$rollback[$component],$images[$component]) "restore-$component" }
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build') + $components) 'rollback'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'rollback-nginx'
    throw
}
