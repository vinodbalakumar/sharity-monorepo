$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$state = Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$compose = @('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
$images = @{}; $rollback = @{}
function Docker-Step([string[]]$Arguments, [string]$Name) {
    $process = Start-Process docker.exe -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/login-deploy-$Name.log") -RedirectStandardError (Join-Path $workspace "outputs/login-deploy-$Name.err.log")
    if ($process.ExitCode -ne 0) { throw "Docker step failed: $Name" }
}
function Wait-Healthy([string]$Service) {
    for ($attempt=0; $attempt -lt 48; $attempt++) {
        $status = docker inspect --format '{{json .State}}' "sharity-local-$Service-1" | ConvertFrom-Json
        if ($status.Status -in @('exited','dead')) { throw "Startup failed: $Service" }
        if ($status.Health.Status -eq 'healthy') { return }
        Start-Sleep -Seconds 5
    }
    throw "Readiness timed out: $Service"
}
$stamp = Get-Date -Format yyyyMMdd-HHmmss
foreach ($service in @('authorization-server','platform-web-bff')) {
    if ((Get-Content (Join-Path $workspace "outputs/publish-$service.log") -Raw) -notmatch 'BUILD SUCCESS') { throw "Verify $service first." }
    $jar = Get-ChildItem (Join-Path $workspace "$service/target") -Filter '*.jar' | Select-Object -First 1
    if (@(Get-ChildItem (Join-Path $workspace "$service/src/main") -Recurse -File | Where-Object LastWriteTimeUtc -GT $jar.LastWriteTimeUtc).Count) { throw "Artifact is stale: $service" }
    $images[$service] = "${service}:release-$($state.release)"
    $rollback[$service] = "${service}:before-login-repair-$stamp"
    $current = docker inspect --format '{{.Image}}' "sharity-local-$service-1"
    if ($LASTEXITCODE -ne 0) { throw "Cannot preserve $service" }
    Docker-Step @('tag',$current,$rollback[$service]) "preserve-$service"
    Docker-Step @('build','-t',$images[$service],'-f',(Join-Path $deploy 'dockerfiles/verified-java.Dockerfile'),(Join-Path $workspace $service)) "build-$service"
}
@{ images=$images; rollback=$rollback } | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $workspace 'outputs/login-deployment-rollback.json')
try {
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-t') 'nginx-test'
    Docker-Step ($compose + @('stop','platform-ai-service','platform-diagnostics-gateway')) 'stop-companions'
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','authorization-server','platform-web-bff')) 'up-auth-bff'
    Wait-Healthy 'authorization-server'; Wait-Healthy 'platform-web-bff'
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','--force-recreate','platform-ai-service','platform-diagnostics-gateway')) 'up-companions'
    Wait-Healthy 'platform-ai-service'; Wait-Healthy 'platform-diagnostics-gateway'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload'
    Write-Output 'Login repair deployed; authorization, BFF and network companions healthy.'
} catch {
    foreach ($service in $images.Keys) { Docker-Step @('tag',$rollback[$service],$images[$service]) "restore-$service" }
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','authorization-server','platform-web-bff')) 'rollback-core'
    Wait-Healthy 'platform-web-bff'
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','--force-recreate','platform-ai-service','platform-diagnostics-gateway')) 'rollback-companions'
    throw
}
