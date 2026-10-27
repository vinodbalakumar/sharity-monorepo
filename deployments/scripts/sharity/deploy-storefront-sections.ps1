$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$webReport = Get-Content (Join-Path $workspace 'outputs/storefront-sections-verified.json') -Raw | ConvertFrom-Json
$webBundle = @(Get-ChildItem (Join-Path $workspace 'sharity-app-ui/dist-e2e/_expo/static/js/web') -Filter 'index-*.js')
if ($webReport.stats.expected -lt 46 -or $webReport.stats.unexpected -ne 0 -or $webReport.stats.skipped -ne 0 -or $webReport.stats.flaky -ne 0 -or @($webReport.errors).Count) { throw 'Storefront browser verification did not pass.' }
if ($webBundle.Count -ne 1 -or (Get-FileHash $webBundle[0].FullName -Algorithm SHA256).Hash.ToLowerInvariant() -ne $webReport.bundleSha256) { throw 'Storefront export differs from the tested bundle.' }
$adminReport = Get-Content (Join-Path $workspace 'outputs/storefront-admin-verified.json') -Raw | ConvertFrom-Json
if ($adminReport.stats.expected -lt 4 -or $adminReport.stats.unexpected -ne 0 -or $adminReport.stats.skipped -ne 0 -or $adminReport.stats.flaky -ne 0 -or @($adminReport.errors).Count) { throw 'Admin browser verification did not pass.' }
$adminBundle = @(Get-ChildItem (Join-Path $workspace 'sharity-admin-portal/dist/assets') -Filter 'index-*.js')
if ($adminBundle.Count -ne 1 -or (Get-FileHash $adminBundle[0].FullName -Algorithm SHA256).Hash.ToLowerInvariant() -ne $adminReport.bundleSha256) { throw 'Admin export differs from the tested bundle.' }
if (@(Get-ChildItem (Join-Path $workspace 'sharity-admin-portal/src') -Recurse -File | Where-Object LastWriteTimeUtc -GT $adminBundle[0].LastWriteTimeUtc).Count) { throw 'Admin source changed after export.' }
$jar = Get-Item (Join-Path $workspace 'marketplace-service/target/marketplace-service-0.0.1-SNAPSHOT.jar')
if (@(Get-ChildItem (Join-Path $workspace 'marketplace-service/src') -Recurse -File | Where-Object LastWriteTimeUtc -GT $jar.LastWriteTimeUtc).Count) { throw 'Marketplace artifact is stale.' }
$mavenLog = Get-Content (Join-Path $workspace 'outputs/storefront-sections-maven.log') -Raw
if (!$mavenLog.Contains('BUILD SUCCESS') -or !$mavenLog.Contains('Tests run: 59, Failures: 0, Errors: 0, Skipped: 0')) { throw 'Marketplace verification did not pass.' }
$release = (Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json).release
$compose = @('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
$stamp = Get-Date -Format yyyyMMdd-HHmmss
$targets = @(
    @{service='marketplace-service'; image="marketplace-service:release-$release"; dockerfile='verified-java.Dockerfile'; context='marketplace-service'},
    @{service='sharity-admin-portal'; image='sharity-admin-portal:latest'; dockerfile='verified-admin.Dockerfile'; context='sharity-admin-portal'}
)
function Docker-Step([string[]]$Arguments, [string]$Name) {
    $process = Start-Process docker.exe -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/sections-deploy-$Name.log") -RedirectStandardError (Join-Path $workspace "outputs/sections-deploy-$Name.err.log")
    if ($process.ExitCode -ne 0) { throw "Docker step failed: $Name" }
}
function Wait-Marketplace {
    for ($attempt=0; $attempt -lt 90; $attempt++) {
        if ((docker inspect --format '{{.State.Health.Status}}' sharity-local-marketplace-service-1) -eq 'healthy') { return }
        Start-Sleep -Seconds 4
    }
    throw 'Marketplace readiness timed out.'
}
foreach ($target in $targets) {
    $target.previous = docker inspect --format '{{.Image}}' "sharity-local-$($target.service)-1"
    if ($LASTEXITCODE -ne 0) { throw 'Cannot preserve deployed image.' }
    $target.rollback = "$($target.service):before-sections-$stamp"
    Docker-Step @('tag',$target.previous,$target.rollback) "preserve-$($target.service)"
    Docker-Step @('build','--build-context',"deployment=$deploy",'-t',$target.image,'-f',(Join-Path $deploy "dockerfiles/$($target.dockerfile)"),(Join-Path $workspace $target.context)) "build-$($target.service)"
}
$targets | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $workspace 'outputs/storefront-sections-rollback.json')
try {
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','marketplace-service')) 'marketplace-up'
    Wait-Marketplace
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-t') 'nginx-test'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload-marketplace'
    $sections = Invoke-RestMethod 'http://localhost:8080/marketplace-service/api/v1/marketplace/home-sections' -TimeoutSec 30
    if (@($sections).Count -ne 6) { throw 'Storefront section API did not return six settings.' }
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','sharity-admin-portal')) 'admin-up'
    Docker-Step @('exec','sharity-local-sharity-admin-portal-1','wget','-qO-','http://127.0.0.1:8080/index.html') 'admin-ready'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload-admin'
    & (Join-Path $PSScriptRoot 'deploy-verified-storefront.ps1') -VerificationReport 'outputs/storefront-sections-verified.json' -MinimumPassingScenarios 46
    if (!$?) { throw 'Storefront deployment failed.' }
    Write-Output 'Marketplace, admin portal, and storefront deployed with verified artifacts.'
} catch {
    foreach ($target in $targets) { Docker-Step @('tag',$target.rollback,$target.image) "restore-$($target.service)" }
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','marketplace-service','sharity-admin-portal')) 'rollback'
    Wait-Marketplace
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'rollback-reload'
    throw
}
