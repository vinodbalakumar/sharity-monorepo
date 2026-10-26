$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$state=Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$bundle=Get-ChildItem (Join-Path $workspace 'sharity-app-ui/dist-e2e/_expo/static/js/web') -Filter 'index-*.js' | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
$latestSource=Get-ChildItem (Join-Path $workspace 'sharity-app-ui/src') -Recurse -File | Where-Object {$_.Extension -in '.ts','.tsx'} | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
if (-not $bundle -or $bundle.LastWriteTimeUtc -lt $latestSource.LastWriteTimeUtc) { throw 'Web export is missing or older than application sources.' }
$image="sharity-app:release-$($state.release)"
$rollback="sharity-app:before-chat-sources-$(Get-Date -Format yyyyMMdd-HHmmss)"
function Docker-Step([string[]]$Arguments,[string]$Name) {
    $p=Start-Process docker.exe -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/chat-sources-web-$Name.out.log") -RedirectStandardError (Join-Path $workspace "outputs/chat-sources-web-$Name.log")
    if ($p.ExitCode -ne 0) { throw "Web deployment step $Name failed." }
}
$current=docker inspect --format '{{.Image}}' sharity-local-sharity-app-1
if ($LASTEXITCODE -ne 0) { throw 'Cannot preserve previous web image.' }
Docker-Step @('tag',$current,$rollback) 'preserve'
@{rollbackImage=$rollback;previousImageId=$current;releaseImage=$image}|ConvertTo-Json|Set-Content (Join-Path $workspace 'outputs/chat-sources-web-rollback.json')
Docker-Step @('build','--build-context',"deployment=$deploy",'--progress=plain','--label','sharity.source=verified-chat-sources','-t',$image,'-f',(Join-Path $deploy 'dockerfiles/verified-web.Dockerfile'),(Join-Path $workspace 'sharity-app-ui')) 'build'
$compose=@('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
try {
    Docker-Step ($compose+@('up','-d','--no-deps','--no-build','sharity-app')) 'up'
    $healthy=$false
    for ($attempt=0;$attempt -lt 20;$attempt++) {
        $health=docker inspect --format '{{.State.Health.Status}}' sharity-local-sharity-app-1
        if ($health -eq 'healthy') { $healthy=$true; break }
        Start-Sleep -Seconds 5
    }
    if (-not $healthy) { throw 'Updated web container did not become healthy.' }
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-t') 'nginx-check'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload'
    Write-Output 'HEALTHY chat-sources web deployment'
} catch {
    Docker-Step @('tag',$rollback,$image) 'restore-image'
    Docker-Step ($compose+@('up','-d','--no-deps','--no-build','sharity-app')) 'rollback'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'rollback-nginx-reload'
    throw
}
