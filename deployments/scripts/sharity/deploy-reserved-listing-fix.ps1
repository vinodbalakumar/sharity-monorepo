$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$log = Get-Content (Join-Path $workspace 'outputs/reserved-listing-maven.log') -Raw
if (!$log.Contains('BUILD SUCCESS') -or !$log.Contains('Tests run: 61, Failures: 0, Errors: 0, Skipped: 0')) { throw 'Marketplace verification did not pass.' }
$report = Get-Content (Join-Path $workspace 'outputs/reserved-listing-browser.json') -Raw | ConvertFrom-Json
if ($report.stats.expected -lt 4 -or $report.stats.unexpected -ne 0 -or $report.stats.skipped -ne 0 -or $report.stats.flaky -ne 0 -or @($report.errors).Count) { throw 'Product page verification did not pass.' }
$jar = Get-Item (Join-Path $workspace 'marketplace-service/target/marketplace-service-0.0.1-SNAPSHOT.jar')
if (@(Get-ChildItem (Join-Path $workspace 'marketplace-service/src') -Recurse -File | Where-Object LastWriteTimeUtc -GT $jar.LastWriteTimeUtc).Count) { throw 'Marketplace artifact is stale.' }
$release = (Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json).release
$image = "marketplace-service:release-$release"
$rollback = 'marketplace-service:before-reserved-fix-' + (Get-Date -Format yyyyMMdd-HHmmss)
$previous = docker inspect --format '{{.Image}}' sharity-local-marketplace-service-1
$compose = @('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
function Docker-Step([string[]]$Arguments, [string]$Name) {
    $process = Start-Process docker.exe -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/reserved-deploy-$Name.log") -RedirectStandardError (Join-Path $workspace "outputs/reserved-deploy-$Name.err.log")
    if ($process.ExitCode -ne 0) { throw "Docker step failed: $Name" }
}
function Wait-Healthy {
    for ($attempt=0; $attempt -lt 90; $attempt++) {
        if ((docker inspect --format '{{.State.Health.Status}}' sharity-local-marketplace-service-1) -eq 'healthy') { return }
        Start-Sleep -Seconds 4
    }
    throw 'Marketplace readiness timed out.'
}
Docker-Step @('tag',$previous,$rollback) 'preserve'
@{previous=$previous;image=$image;rollback=$rollback;jarSha256=(Get-FileHash $jar.FullName -Algorithm SHA256).Hash.ToLowerInvariant()} | ConvertTo-Json | Set-Content (Join-Path $workspace 'outputs/reserved-listing-rollback.json')
Docker-Step @('build','-t',$image,'-f',(Join-Path $deploy 'dockerfiles/verified-java.Dockerfile'),(Join-Path $workspace 'marketplace-service')) 'build'
try {
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','marketplace-service')) 'up'
    Wait-Healthy
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-t') 'nginx-test'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload'
    $listing = Invoke-RestMethod 'http://localhost:8080/marketplace-service/api/v1/marketplace/listings/4334261a-61b4-450a-aad9-1b3aae459bfb' -TimeoutSec 30
    if ($listing.listingStatus -ne 'RESERVED') { throw 'Reserved listing smoke check failed.' }
    Write-Output 'Marketplace is healthy; reserved listing details return successfully.'
} catch {
    Docker-Step @('tag',$rollback,$image) 'restore'
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','marketplace-service')) 'rollback'
    Wait-Healthy
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'rollback-reload'
    throw
}
