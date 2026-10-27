param([switch]$AllowOfflineProvider)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$verification = Get-Content (Join-Path $workspace 'outputs/mac-ai-verify.log') -Raw
if ($verification -notmatch 'BUILD SUCCESS' -or $verification -match 'BUILD FAILURE') { throw 'AI Maven verification must pass first.' }
$jar = Get-Item (Join-Path $workspace 'platform-ai-service/target/platform-ai-service-0.0.1-SNAPSHOT.jar')
if (@(Get-ChildItem (Join-Path $workspace 'platform-ai-service/src/main') -Recurse -File | Where-Object LastWriteTimeUtc -GT $jar.LastWriteTimeUtc).Count) { throw 'Rebuild the AI artifact after source changes.' }
$modelServer = if ($env:OLLAMA_BASE_URL) { $env:OLLAMA_BASE_URL } else { 'http://192.168.0.149:11434' }
try {
    $models = Invoke-RestMethod "$modelServer/api/tags" -TimeoutSec 10
    if ('qwen3:8b' -notin $models.models.name) { throw 'Mac does not contain qwen3:8b.' }
} catch {
    if (-not $AllowOfflineProvider) { throw }
    Write-Warning 'Mac provider is currently unavailable. Deploying configuration only; generated answers cannot be verified until it returns. No downloads or Windows fallback.'
}
& python (Join-Path $PSScriptRoot 'sync-ai-catalog.py')
if ($LASTEXITCODE -ne 0) { throw 'Public catalog verification failed.' }
$state = Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$release = "platform-ai-service:release-$($state.release)"
$rollback = "platform-ai-service:before-mac-$(Get-Date -Format yyyyMMdd-HHmmss)"
function Docker-Step([string[]]$Arguments, [string]$Name) {
    $process = Start-Process docker.exe -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/mac-ai-$Name.log") -RedirectStandardError (Join-Path $workspace "outputs/mac-ai-$Name.err.log")
    if ($process.ExitCode -ne 0) { throw "Docker step failed: $Name" }
}
$compose = @('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
Docker-Step ($compose + @('config','--quiet')) 'config'
$previous = docker inspect --format '{{.Image}}' sharity-local-platform-ai-service-1
if ($LASTEXITCODE -ne 0) { throw 'Cannot preserve the current AI image.' }
Docker-Step @('tag',$previous,$rollback) 'preserve'
@{ previousImage=$previous; rollbackImage=$rollback; model='qwen3:8b'; endpoint=$modelServer } | ConvertTo-Json | Set-Content (Join-Path $workspace 'outputs/mac-ai-rollout.json')
Docker-Step @('build','-t',$release,'-f',(Join-Path $deploy 'dockerfiles/verified-java.Dockerfile'),(Join-Path $workspace 'platform-ai-service')) 'build'
Docker-Step ($compose + @('up','-d','--no-deps','--no-build','platform-ai-service')) 'up'
for ($attempt=0; $attempt -lt 36; $attempt++) {
    $status = docker inspect --format '{{json .State}}' sharity-local-platform-ai-service-1 | ConvertFrom-Json
    if ($status.Status -in @('exited','dead')) { throw 'AI service startup failed; preserved image is recorded in mac-ai-rollout.json.' }
    if ($status.Health.Status -eq 'healthy') { Write-Output 'Mac-backed AI deployed and healthy. Tesla remains disabled.'; exit 0 }
    Start-Sleep -Seconds 5
}
throw 'AI did not become healthy within the readiness window.'
