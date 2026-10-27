param(
    [string]$VerificationReport = 'outputs/storefront-shell-verified.json',
    [ValidateRange(1, 10000)][int]$MinimumPassingScenarios = 90
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$reportPath = if ([IO.Path]::IsPathRooted($VerificationReport)) { $VerificationReport } else { Join-Path $workspace $VerificationReport }
$report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
if ($report.stats.expected -lt $MinimumPassingScenarios -or $report.stats.unexpected -ne 0 -or $report.stats.skipped -ne 0 -or $report.stats.flaky -ne 0 -or @($report.errors).Count -ne 0) { throw 'Required browser verification did not pass cleanly.' }
$bundles = @(Get-ChildItem (Join-Path $workspace 'sharity-app-ui/dist-e2e/_expo/static/js/web') -Filter 'index-*.js')
if ($bundles.Count -ne 1) { throw 'Expected one exported web entry bundle.' }
$bundle = $bundles[0]
if ((Get-FileHash -Algorithm SHA256 $bundle.FullName).Hash.ToLowerInvariant() -ne $report.bundleSha256) { throw 'Export differs from the tested bundle.' }
if ($bundle.LastWriteTimeUtc -gt [DateTime]::Parse($report.stats.startTime).ToUniversalTime()) { throw 'Export changed after browser verification started.' }
if (@(Get-ChildItem (Join-Path $workspace 'sharity-app-ui/src') -Recurse -File | Where-Object LastWriteTimeUtc -GT $bundle.LastWriteTimeUtc).Count) { throw 'Source is newer than the verified export.' }
$state = Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$image = "sharity-app:release-$($state.release)"
$stamp = Get-Date -Format yyyyMMdd-HHmmss
$rollback = "sharity-app:before-storefront-$stamp"
$compose = @('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
function Docker-Step([string[]]$Arguments, [string]$Name) {
    $process = Start-Process docker.exe -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/storefront-deploy-$Name.log") -RedirectStandardError (Join-Path $workspace "outputs/storefront-deploy-$Name.err.log")
    if ($process.ExitCode -ne 0) { throw "Docker step failed: $Name" }
}
function Wait-Healthy {
    for ($attempt=0; $attempt -lt 36; $attempt++) {
        if ((docker inspect --format '{{.State.Health.Status}}' sharity-local-sharity-app-1) -eq 'healthy') { return }
        Start-Sleep -Seconds 3
    }
    throw 'Storefront readiness timed out.'
}
$current = docker inspect --format '{{.Image}}' sharity-local-sharity-app-1
if ($LASTEXITCODE -ne 0) { throw 'Cannot preserve current storefront image.' }
Docker-Step @('tag',$current,$rollback) 'preserve'
@{image=$image;rollback=$rollback;bundleSha256=$report.bundleSha256;time=$stamp} | ConvertTo-Json | Set-Content (Join-Path $workspace 'outputs/storefront-deployment-rollback.json')
Docker-Step @('build','--build-context',"deployment=$deploy",'-t',$image,'-f',(Join-Path $deploy 'dockerfiles/verified-web.Dockerfile'),(Join-Path $workspace 'sharity-app-ui')) 'build'
try {
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','sharity-app')) 'up'
    Wait-Healthy
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-t') 'nginx-test'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload'
    $html = Invoke-WebRequest -UseBasicParsing 'http://localhost:8080/app/' -TimeoutSec 30
    if ($html.StatusCode -ne 200 -or -not $html.Content.Contains($bundle.Name)) { throw 'Served storefront does not match the tested export.' }
    Write-Output 'Storefront deployed; healthy container serves the exact tested export.'
} catch {
    Docker-Step @('tag',$rollback,$image) 'restore'
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','sharity-app')) 'rollback'
    Wait-Healthy
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'rollback-reload'
    throw
}
