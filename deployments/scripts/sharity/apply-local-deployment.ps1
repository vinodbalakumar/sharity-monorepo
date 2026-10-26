param([string]$ResumeFrom='')
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$state=Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$compose=@('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
$services=@('authorization-server','marketplace-service','payment-service','wallet-service','platform-web-bff','platform-ai-service','platform-diagnostics-gateway','sharity-app')
$results=@()
$startIndex=0
if ($ResumeFrom) {
    $startIndex=[Array]::IndexOf($services,$ResumeFrom)
    if ($startIndex -lt 0) { throw 'Unknown resume service' }
    $saved=Get-Content (Join-Path $workspace 'outputs/local-deployment-results.json') -Raw | ConvertFrom-Json
    foreach ($entry in $saved) {
        $entries=if ($entry.PSObject.Properties['value']) { $entry.value } else { @($entry) }
        foreach ($item in $entries) { if ([Array]::IndexOf($services,$item.service) -lt $startIndex) { $results += $item } }
    }
}
function Run-Docker([string[]]$Arguments,[string]$Name) {
    $process=Start-Process -FilePath 'docker.exe' -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/deploy-$Name.out.log") -RedirectStandardError (Join-Path $workspace "outputs/deploy-$Name.log")
    if ($process.ExitCode -ne 0) { throw "Docker step $Name failed; inspect its deployment log." }
}
function Wait-Healthy([string]$Service) {
    $container="sharity-local-$Service-1"
    for ($attempt=0;$attempt -lt 60;$attempt++) {
        $inspection=docker inspect --format '{{json .State}}' $container | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0) { throw "Cannot inspect $Service" }
        if ($inspection.Health.Status -eq 'healthy') { return }
        # A failed early health sample can recover while a cold application starts.
        if ($inspection.Status -in @('exited','dead')) { throw "$Service failed readiness." }
        Start-Sleep -Seconds 5
    }
    throw "$Service readiness timed out."
}
foreach ($service in $services) {
    if ($service -eq 'platform-diagnostics-gateway') { continue }
    docker image inspect --format '{{.Id}}' "${service}:release-$($state.release)" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Missing release image for $service" }
}
Run-Docker ($compose+@('config','--quiet')) 'compose-validation'
try {
    foreach ($service in $services[$startIndex..($services.Count-1)]) {
        Write-Output "DEPLOYING $service"
        if ($service -eq 'platform-web-bff') {
            $existingGateway=docker ps -q --filter 'name=^/sharity-local-platform-diagnostics-gateway-1$'
            if ($existingGateway) { Run-Docker ($compose+@('stop','platform-diagnostics-gateway')) 'stop-gateway-before-bff' }
            $existingAi=docker ps -q --filter 'name=^/sharity-local-platform-ai-service-1$'
            if ($existingAi) { Run-Docker ($compose+@('stop','platform-ai-service')) 'stop-ai-before-bff' }
        }
        $upArgs=$compose+@('up','-d','--no-deps','--no-build')
        if ($service -in @('platform-ai-service','platform-diagnostics-gateway')) { $upArgs += '--force-recreate' }
        Run-Docker ($upArgs+@($service)) ("up-$service")
        Wait-Healthy $service
        $inspection=docker inspect --format '{{json .State}}' "sharity-local-$service-1" | ConvertFrom-Json
        $image=if ($service -eq 'platform-diagnostics-gateway') { 'nginx:1.27-alpine' } else { "${service}:release-$($state.release)" }
        $results += [pscustomobject]@{ service=$service; status=$inspection.Status; health=$inspection.Health.Status; image=$image }
        [IO.File]::WriteAllText((Join-Path $workspace 'outputs/local-deployment-results.json'),($results | ConvertTo-Json -Depth 5))
        Write-Output "HEALTHY $service"
        if ($service -eq 'platform-diagnostics-gateway') {
            Run-Docker @('exec','sharity-local-authorization-server-1','java','-cp','/run/sharity','TlsProbe','https://platform-web-bff:8443/health') 'diagnostic-tls-probe'
            Write-Output 'VERIFIED Java TLS trust and hostname checks for diagnostic delivery.'
        }
    }
    Run-Docker @('exec','sharity-local-nginx-1','nginx','-t') 'nginx-validation'
    Run-Docker @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload'
    Write-Output "DEPLOYED release $($state.release); all selected services healthy; Nginx reloaded."
} catch {
    # Additive schema changes remain; never overwrite current data automatically.
    $failedService=$service
    $previous=$state.rollback | Where-Object service -EQ $failedService | Select-Object -First 1
    if ($previous) {
        $rollbackFile=Join-Path $state.backupDirectory 'failed-service-rollback.yml'
        [IO.File]::WriteAllText($rollbackFile,"services:`n  ${failedService}:`n    image: $($previous.rollbackTag)`n")
        try {
            Run-Docker ($compose+@('-f',$rollbackFile,'up','-d','--no-deps','--no-build',$failedService)) 'failed-service-rollback'
            Write-Output "ROLLED BACK $failedService to its preserved image."
        } catch { Write-Output "Automatic rollback needs operator inspection; preserved images and backups remain available." }
    } else {
        try { Run-Docker ($compose+@('stop',$failedService)) 'stop-failed-new-service' } catch {}
    }
    throw
}
