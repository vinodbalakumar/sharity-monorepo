$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$verification=Get-Content (Join-Path $workspace 'outputs/deployment-ai-final-exit.json') -Raw | ConvertFrom-Json
if ($verification.exitCode -ne 0) { throw 'AI Maven verification failed.' }
$compose=@('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
function Docker-Step([string[]]$Arguments,[string]$Name) {
    $p=Start-Process -FilePath 'docker.exe' -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/deploy-final-$Name.out.log") -RedirectStandardError (Join-Path $workspace "outputs/deploy-final-$Name.log")
    if ($p.ExitCode -ne 0) { throw "Docker step $Name failed." }
}
function Healthy([string]$Service) {
    for ($attempt=0;$attempt -lt 60;$attempt++) {
        $s=docker inspect --format '{{json .State}}' "sharity-local-$Service-1" | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0 -or $s.Status -in @('exited','dead')) { throw "$Service is not running." }
        if ($s.Health.Status -eq 'healthy') { Write-Output "HEALTHY $Service"; return }
        Start-Sleep -Seconds 5
    }
    throw "$Service readiness timed out."
}
Docker-Step ($compose+@('config','--quiet')) 'config'
# Tesla remains disabled: no Tesla service or profile is started here.
Docker-Step ($compose+@('up','-d','--no-deps','--no-build','marketplace-service')) 'marketplace'
Healthy 'marketplace-service'
Docker-Step ($compose+@('up','-d','--no-deps','--no-build','--force-recreate','platform-ai-service')) 'ai'
Healthy 'platform-ai-service'
Docker-Step @('exec','sharity-local-authorization-server-1','java','-cp','/run/sharity','TlsProbe','https://platform-web-bff:8443/health') 'tls'
$warm=Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8080/bff/public/marketplace-service/api/v1/marketplace/home' -TimeoutSec 60 -ErrorAction Continue
Write-Output "CATALOG_WARMUP_HTTP $($warm.StatusCode)"
