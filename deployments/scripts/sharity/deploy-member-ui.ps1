$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$state = Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$report = Get-Content (Join-Path $workspace 'outputs/member-ui-verified.json') -Raw | ConvertFrom-Json
if ($report.stats.unexpected -ne 0 -or $report.stats.expected -lt 70 -or $report.stats.flaky -ne 0 -or $report.stats.skipped -ne 0) {
    throw 'Final account, logout and chat-layout checks must pass before rollout.'
}
if (($report.baselineStats.expected + $report.baselineStats.unexpected) -lt 300 -or
    $report.baselineStats.unexpected -ne @($report.resolvedBaselineFailures).Count -or
    $report.unresolvedFailures -ne 0) {
    throw 'Full regression evidence and resolution of every baseline failure are required.'
}
$bundle = Get-ChildItem (Join-Path $workspace 'sharity-app-ui/dist-e2e/_expo/static/js/web') -Filter 'index-*.js' | Select-Object -First 1
if ((Get-FileHash -Algorithm SHA256 $bundle.FullName).Hash.ToLowerInvariant() -ne $report.bundleSha256) { throw 'The browser-tested export changed.' }
if (@(Get-ChildItem (Join-Path $workspace 'sharity-app-ui/src') -Recurse -File | Where-Object LastWriteTimeUtc -GT $bundle.LastWriteTimeUtc).Count) { throw 'Export is older than its sources.' }
$image = "sharity-app:release-$($state.release)"
$stamp = Get-Date -Format yyyyMMdd-HHmmss
$rollback = "sharity-app:before-member-ui-$stamp"
$compose = @('compose','-p','sharity-local','--env-file','.env','--env-file','.env.backend-local.properties','--env-file','.env.ai.local','-f','docker-compose.yml','-f','docker-compose.local.yml','-f','docker-compose.ai.yml')
function Docker-Step([string[]]$Arguments, [string]$Name) {
    $process = Start-Process docker.exe -ArgumentList $Arguments -WorkingDirectory $deploy -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/member-deploy-$Name.log") -RedirectStandardError (Join-Path $workspace "outputs/member-deploy-$Name.err.log")
    if ($process.ExitCode -ne 0) { throw "Docker step failed: $Name" }
}
function Wait-Healthy {
    for ($attempt=0; $attempt -lt 36; $attempt++) {
        $status = docker inspect --format '{{.State.Health.Status}}' sharity-local-sharity-app-1
        if ($status -eq 'healthy') { return }
        Start-Sleep -Seconds 3
    }
    throw 'Storefront readiness timed out.'
}
$current = docker inspect --format '{{.Image}}' sharity-local-sharity-app-1
if ($LASTEXITCODE -ne 0) { throw 'Cannot preserve current storefront.' }
Docker-Step @('tag',$current,$rollback) 'preserve'
@{ image=$image; rollback=$rollback; bundleSha256=$report.bundleSha256 } | ConvertTo-Json | Set-Content (Join-Path $workspace 'outputs/member-ui-rollback.json')
Docker-Step @('build','--build-context',"deployment=$deploy",'-t',$image,'-f',(Join-Path $deploy 'dockerfiles/verified-web.Dockerfile'),(Join-Path $workspace 'sharity-app-ui')) 'build'
try {
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','sharity-app')) 'up'
    Wait-Healthy
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-t') 'nginx-test'
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'nginx-reload'
    $html = Invoke-WebRequest -UseBasicParsing 'http://localhost:8080/app/' -TimeoutSec 30
    if ($html.StatusCode -ne 200 -or -not $html.Content.Contains($bundle.Name)) { throw 'Served storefront does not match the tested export.' }
    Write-Output 'Member UI deployed; healthy storefront serves the exact browser-tested export.'
} catch {
    Docker-Step @('tag',$rollback,$image) 'restore'
    Docker-Step ($compose + @('up','-d','--no-deps','--no-build','sharity-app')) 'rollback'
    Wait-Healthy
    Docker-Step @('exec','sharity-local-nginx-1','nginx','-s','reload') 'rollback-reload'
    throw
}
