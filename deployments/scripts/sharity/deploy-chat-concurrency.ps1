param([ValidateSet('concurrency','latency','info')][string]$Change='concurrency')
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$verification=Get-Content (Join-Path $workspace "outputs/chat-$Change-exit.json") -Raw | ConvertFrom-Json
if ($verification.exitCode -ne 0) { throw "AI $Change verification failed." }
if ((Get-Item (Join-Path $workspace "outputs/chat-$Change-exit.json")).LastWriteTimeUtc -lt (Get-Item (Join-Path $workspace "outputs/chat-$Change-verify.log")).LastWriteTimeUtc) { throw 'Verification is still running or its exit record is stale.' }
$jar=Get-ChildItem (Join-Path $workspace 'platform-ai-service/target') -Filter '*.jar' | Select-Object -First 1
if (-not $jar -or @(Get-ChildItem (Join-Path $workspace 'platform-ai-service/src/main') -Recurse -File | Where-Object LastWriteTimeUtc -GT $jar.LastWriteTimeUtc).Count -gt 0) { throw 'AI source is newer than its built artifact.' }
$state=Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$release="platform-ai-service:release-$($state.release)"
$rollback="platform-ai-service:before-$Change-$(Get-Date -Format yyyyMMdd-HHmmss)"
$current=docker inspect --format '{{.Image}}' sharity-local-platform-ai-service-1
if ($LASTEXITCODE -ne 0) { throw 'Cannot identify current AI image.' }
function Docker-Step([string[]]$Arguments,[string]$Name) {
    $p=Start-Process -FilePath 'docker.exe' -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/$Change-$Name.out.log") -RedirectStandardError (Join-Path $workspace "outputs/$Change-$Name.log")
    if ($p.ExitCode -ne 0) { throw "Docker step $Name failed." }
}
$compose=@('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
Docker-Step @('tag',$current,$rollback) 'preserve-image'
@{rollbackImage=$rollback;previousImageId=$current;releaseImage=$release}|ConvertTo-Json|Set-Content (Join-Path $workspace "outputs/chat-$Change-rollback.json")
Docker-Step @('build','--progress=plain','--label',"sharity.release=$($state.release)",'--label',"sharity.source=verified-chat-$Change",'-t',$release,'-f',(Join-Path $deploy 'dockerfiles/verified-java.Dockerfile'),(Join-Path $workspace 'platform-ai-service')) 'build'
Docker-Step ($compose+@('config','--quiet')) 'config'
try {
    Docker-Step ($compose+@('up','-d','--no-deps','--no-build','--force-recreate','platform-ai-service')) 'up'
    for ($attempt=0;$attempt -lt 60;$attempt++) {
        $s=docker inspect --format '{{json .State}}' sharity-local-platform-ai-service-1 | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0 -or $s.Status -in @('exited','dead')) { throw 'AI startup failed.' }
        if ($s.Health.Status -eq 'healthy') { Write-Output "HEALTHY AI $Change deployment"; exit 0 }
        Start-Sleep -Seconds 5
    }
    throw 'AI readiness timed out.'
} catch {
    Docker-Step @('tag',$rollback,$release) 'restore-image'
    Docker-Step ($compose+@('up','-d','--no-deps','--no-build','--force-recreate','platform-ai-service')) 'rollback'
    throw
}
