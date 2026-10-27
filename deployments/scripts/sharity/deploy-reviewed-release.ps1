$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$state = Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$backends = @('authorization-server','marketplace-service','payment-service','wallet-service','platform-web-bff','platform-ai-service')
$services = $backends + @('platform-diagnostics-gateway','sharity-app','sharity-admin-portal')
$images = @{}
$rollback = @{}
$stamp = Get-Date -Format yyyyMMdd-HHmmss
$browser = Get-Content (Join-Path $workspace 'outputs/quality-verified-results.json') -Raw | ConvertFrom-Json
if ($browser.stats.unexpected -ne 0 -or $browser.stats.expected -lt 326) { throw 'Browser regression verification must pass before rollout.' }
$bundle = Get-ChildItem (Join-Path $workspace 'sharity-app-ui/dist-e2e/_expo/static/js/web') -Filter 'index-*.js' | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
if ((Get-FileHash $bundle.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -ne $browser.bundleSha256) { throw 'The storefront bundle differs from the tested artifact.' }
$adminAudit = Get-Content (Join-Path $workspace 'outputs/quality-admin-audit.json') -Raw | ConvertFrom-Json
if ($adminAudit.Count -lt 26 -or @($adminAudit | Where-Object { $_.overflow -or $_.errors.Count }).Count) { throw 'Admin screen audit must pass before rollout.' }
foreach ($service in $backends) {
    $log = if ($service -eq 'platform-ai-service') { 'mac-ai-verify.log' } else { "publish-$service.log" }
    if ((Get-Content (Join-Path $workspace "outputs/$log") -Raw) -notmatch 'BUILD SUCCESS') { throw "Missing successful verification: $service" }
    $jar = Get-ChildItem (Join-Path $workspace "$service/target") -Filter '*.jar' | Select-Object -First 1
    if (-not $jar -or @(Get-ChildItem (Join-Path $workspace "$service/src/main") -Recurse -File | Where-Object LastWriteTimeUtc -GT $jar.LastWriteTimeUtc).Count) { throw "Artifact is missing or stale: $service" }
    $images[$service] = "${service}:release-$($state.release)"
}
$images['sharity-app'] = "sharity-app:release-$($state.release)"
$images['sharity-admin-portal'] = 'sharity-admin-portal:latest'
function Docker-Step([string[]]$Arguments, [string]$Name) {
    $process = Start-Process docker.exe -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/publish-deploy-$Name.log") -RedirectStandardError (Join-Path $workspace "outputs/publish-deploy-$Name.err.log")
    if ($process.ExitCode -ne 0) { throw "Docker step failed: $Name" }
}
$compose = @('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
Docker-Step ($compose + @('config','--quiet')) 'config'
foreach ($service in $images.Keys) {
    $current = docker inspect --format '{{.Image}}' "sharity-local-$service-1"
    if ($LASTEXITCODE -ne 0) { throw "Cannot preserve current $service image" }
    $rollback[$service] = "${service}:before-publish-$stamp"
    Docker-Step @('tag',$current,$rollback[$service]) "preserve-$service"
}
@{ images=$images; rollback=$rollback; time=$stamp } | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $workspace 'outputs/publish-deployment-rollback.json')
foreach ($service in $backends) {
    Docker-Step @('build','-t',$images[$service],'-f',(Join-Path $deploy 'dockerfiles/verified-java.Dockerfile'),(Join-Path $workspace $service)) "build-$service"
}
Docker-Step @('build','--build-context',"deployment=$deploy",'-t',$images['sharity-app'],'-f',(Join-Path $deploy 'dockerfiles/verified-web.Dockerfile'),(Join-Path $workspace 'sharity-app-ui')) 'build-storefront'
Docker-Step @('build','--build-context',"deployment=$deploy",'-t',$images['sharity-admin-portal'],'-f',(Join-Path $deploy 'dockerfiles/verified-admin.Dockerfile'),(Join-Path $workspace 'sharity-admin-portal')) 'build-admin'
try {
    # AI and diagnostic gateway share the BFF network namespace; recreate the group together.
    Docker-Step ($compose + @('stop','platform-ai-service','platform-diagnostics-gateway')) 'stop-bff-companions'
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','--force-recreate') + $services) 'up'
    $ready = $false
    for ($attempt=0; $attempt -lt 48; $attempt++) {
        $unready = @()
        foreach ($service in ($backends + @('platform-diagnostics-gateway','sharity-app'))) {
            $status = docker inspect --format '{{json .State}}' "sharity-local-$service-1" | ConvertFrom-Json
            if ($status.Status -in @('exited','dead')) { throw "Startup failed: $service" }
            if ($status.Health.Status -ne 'healthy') { $unready += $service }
        }
        if (-not $unready.Count) { $ready=$true; break }
        Start-Sleep -Seconds 5
    }
    if (-not $ready) { throw "Readiness timed out: $unready" }
    Docker-Step @('exec','sharity-local-sharity-admin-portal-1','wget','-qO-','http://127.0.0.1:8080/index.html') 'admin-health'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-t') 'nginx-test'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload'
    Docker-Step @('exec','sharity-local-authorization-server-1','java','-cp','/run/sharity','TlsProbe','https://platform-web-bff:8443/health') 'tls-health'
    Write-Output 'All core, AI, storefront and admin components deployed and healthy. TLS verification passed. Tesla remains disabled.'
} catch {
    foreach ($service in $images.Keys) { Docker-Step @('tag',$rollback[$service],$images[$service]) "restore-$service" }
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','--force-recreate') + $services) 'rollback'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'rollback-nginx'
    throw
}
