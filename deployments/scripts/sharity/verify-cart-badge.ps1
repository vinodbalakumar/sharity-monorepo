param([string]$Origin = 'https://vinodbalakumar.com')
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$bundle = Get-ChildItem (Join-Path $workspace 'sharity-app-ui/dist-e2e/_expo/static/js/web') -Filter 'index-*.js'
$report = Get-Content (Join-Path $workspace 'outputs/cart-badge-verified.json') -Raw | ConvertFrom-Json
$html = Invoke-WebRequest -UseBasicParsing "$Origin/app/cart" -TimeoutSec 30
if (!$html.Content.Contains($bundle.Name)) { throw 'Public cart does not serve the verified build.' }
$download = Join-Path $workspace 'outputs/cart-badge-live-bundle.js'
Invoke-WebRequest -UseBasicParsing "$Origin/app/_expo/static/js/web/$($bundle.Name)" -OutFile $download -TimeoutSec 30
$sha = (Get-FileHash $download -Algorithm SHA256).Hash.ToLowerInvariant()
if ($sha -ne $report.bundleSha256) { throw 'Public bundle differs from the tested export.' }
if ((docker inspect --format '{{.State.Health.Status}}' sharity-local-sharity-app-1) -ne 'healthy') { throw 'Storefront is not healthy.' }
$baseline = Get-Content (Join-Path $workspace 'outputs/cart-badge-baseline.json') -Raw | ConvertFrom-Json
foreach ($service in $baseline | Where-Object service -NE 'sharity-app') {
    if ((docker inspect --format '{{.Image}}' "sharity-local-$($service.service)-1") -ne $service.image) { throw 'An unrelated service image changed.' }
}
$record = @{verifiedAt=[DateTime]::UtcNow.ToString('o');origin=$Origin;bundle=$bundle.Name;bundleSha256=$sha;browserChecks=$report.stats.expected;storefrontHealthy=$true;otherServiceImagesUnchanged=$true;authenticatedLiveBrowserVerified=$false;image=(docker inspect --format '{{.Image}}' sharity-local-sharity-app-1)}
$record | ConvertTo-Json | Set-Content (Join-Path $workspace 'outputs/cart-badge-live-verification.json')
Write-Output 'Public cart serves the exact verified bundle; storefront is healthy; other service images are unchanged.'
