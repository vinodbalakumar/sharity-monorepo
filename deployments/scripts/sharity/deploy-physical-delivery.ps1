$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$jar = Get-Item (Join-Path $workspace 'marketplace-service/target/marketplace-service-0.0.1-SNAPSHOT.jar')
if (@(Get-ChildItem (Join-Path $workspace 'marketplace-service/src') -Recurse -File | Where-Object LastWriteTimeUtc -GT $jar.LastWriteTimeUtc).Count) { throw 'Marketplace artifact is stale.' }
$reportFiles = @(Get-ChildItem (Join-Path $workspace 'marketplace-service/target/surefire-reports') -Filter 'TEST-*.xml')
if (-not $reportFiles.Count) { throw 'Missing Maven verification.' }
foreach ($file in $reportFiles) {
    [xml]$result = Get-Content $file.FullName -Raw
    if ([int]$result.testsuite.failures -or [int]$result.testsuite.errors) { throw 'Maven tests failed.' }
}
$state = Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$image = "marketplace-service:release-$($state.release)"
$rollback = "marketplace-service:before-physical-delivery-$(Get-Date -Format yyyyMMdd-HHmmss)"
$compose = @('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
function Docker-Step([string[]]$Arguments, [string]$Name) {
    $process = Start-Process docker.exe -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/physical-delivery-deploy-$Name.log") -RedirectStandardError (Join-Path $workspace "outputs/physical-delivery-deploy-$Name.err.log")
    if ($process.ExitCode -ne 0) { throw "Docker step failed: $Name" }
}
$current = docker inspect --format '{{.Image}}' sharity-local-marketplace-service-1
if ($LASTEXITCODE -ne 0) { throw 'Cannot preserve marketplace image.' }
Docker-Step @('tag',$current,$rollback) 'preserve'
@{image=$image;rollback=$rollback;jarSha256=(Get-FileHash $jar.FullName).Hash} | ConvertTo-Json | Set-Content (Join-Path $workspace 'outputs/physical-delivery-rollback.json')
Docker-Step @('build','-t',$image,'-f',(Join-Path $deploy 'dockerfiles/verified-java.Dockerfile'),(Join-Path $workspace 'marketplace-service')) 'build'
try {
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','marketplace-service')) 'up'
    $ready = $false
    for ($attempt=0; $attempt -lt 40; $attempt++) {
        if ((docker inspect --format '{{.State.Health.Status}}' sharity-local-marketplace-service-1) -eq 'healthy') { $ready=$true; break }
        Start-Sleep -Seconds 3
    }
    if (-not $ready) { throw 'Marketplace readiness timed out.' }
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-t') 'nginx-test'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload'
    $before = Get-Content (Join-Path $workspace 'outputs/physical-delivery-before.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    $after = Invoke-RestMethod 'http://localhost:8080/bff/public/marketplace-service/api/v1/marketplace/listings' -TimeoutSec 30
    if ($after.Count -ne $before.Count) { throw 'Catalog size changed unexpectedly.' }
    foreach ($old in $before) {
        $item = $after | Where-Object publicId -EQ $old.publicId
        if (-not $item) { throw 'A listing disappeared.' }
        if ($old.productType -eq 'PHYSICAL' -and $item.deliveryType -notin @('SHIPPING','SHIPPING_REQUIRED','LOCAL_PICKUP')) { throw 'Physical delivery was not corrected.' }
        if ($old.productType -ne 'PHYSICAL' -and $old.deliveryType -ne $item.deliveryType) { throw 'Digital delivery changed unexpectedly.' }
    }
    $after | ConvertTo-Json -Depth 12 | Set-Content (Join-Path $workspace 'outputs/physical-delivery-after.json') -Encoding UTF8
    Write-Output 'Marketplace healthy; physical delivery corrected and digital delivery preserved.'
} catch {
    Docker-Step @('tag',$rollback,$image) 'restore'
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','marketplace-service')) 'rollback'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'rollback-reload'
    throw
}
