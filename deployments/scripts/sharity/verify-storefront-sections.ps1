param([string]$Origin = 'https://vinodbalakumar.com')
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$webBundle = Get-ChildItem (Join-Path $workspace 'sharity-app-ui/dist-e2e/_expo/static/js/web') -Filter 'index-*.js'
$adminBundle = Get-ChildItem (Join-Path $workspace 'sharity-admin-portal/dist/assets') -Filter 'index-*.js'
$webHtml = Invoke-WebRequest -UseBasicParsing "$Origin/app/" -TimeoutSec 30
$adminHtml = Invoke-WebRequest -UseBasicParsing "$Origin/sharity-admin/storefront" -TimeoutSec 30
if (!$webHtml.Content.Contains($webBundle.Name) -or !$adminHtml.Content.Contains($adminBundle.Name)) { throw 'Public HTML differs from tested exports.' }
$liveWeb = Join-Path $workspace 'outputs/storefront-live-bundle.js'
$liveAdmin = Join-Path $workspace 'outputs/storefront-admin-live-bundle.js'
Invoke-WebRequest -UseBasicParsing "$Origin/app/_expo/static/js/web/$($webBundle.Name)" -OutFile $liveWeb -TimeoutSec 30
Invoke-WebRequest -UseBasicParsing "$Origin/sharity-admin/assets/$($adminBundle.Name)" -OutFile $liveAdmin -TimeoutSec 30
$webSha = (Get-FileHash $liveWeb -Algorithm SHA256).Hash.ToLowerInvariant()
$adminSha = (Get-FileHash $liveAdmin -Algorithm SHA256).Hash.ToLowerInvariant()
if ($webSha -ne (Get-FileHash $webBundle.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -or $adminSha -ne (Get-FileHash $adminBundle.FullName -Algorithm SHA256).Hash.ToLowerInvariant()) { throw 'Public bundles differ from tested exports.' }
$response = Invoke-WebRequest -UseBasicParsing "$Origin/bff/public/marketplace-service/api/v1/marketplace/home-sections" -TimeoutSec 30
$sections = $response.Content | ConvertFrom-Json
if (@($sections).Count -ne 6) { throw 'Public section settings are unavailable.' }
$listings = Invoke-RestMethod "$Origin/bff/public/marketplace-service/api/v1/marketplace/listings?sort=discount" -TimeoutSec 30
$rankedIds = @($sections | ForEach-Object { $_.listingIds } | Select-Object -Unique)
$resolvedOutsideCatalog = 0
foreach ($listingId in $rankedIds) {
    if ($listingId -and $listingId -notin $listings.publicId) {
        $product = Invoke-RestMethod "$Origin/bff/public/marketplace-service/api/v1/marketplace/listings/$([Uri]::EscapeDataString($listingId))" -TimeoutSec 30
        if ($product.publicId -ne $listingId -or $product.stockQuantity -le 0) { throw 'Ranked product cannot be opened.' }
        $resolvedOutsideCatalog++
    }
}
$adminStatus = 0
try { $denied = Invoke-WebRequest -UseBasicParsing "$Origin/marketplace-service/api/v1/marketplace/admin/home-sections" -TimeoutSec 30; $adminStatus = [int]$denied.StatusCode }
catch { $adminStatus = [int]$_.Exception.Response.StatusCode }
if ($adminStatus -ne 401) { throw 'Anonymous admin access was not denied.' }
$images = @('sharity-app','sharity-admin-portal','marketplace-service') | ForEach-Object { @{service=$_;image=(docker inspect --format '{{.Image}}' "sharity-local-$_-1")} }
$record = @{verifiedAt=[DateTime]::UtcNow.ToString('o');origin=$Origin;storefrontBundle=$webBundle.Name;storefrontSha256=$webSha;adminBundle=$adminBundle.Name;adminSha256=$adminSha;sectionCount=@($sections).Count;sections=@($sections | Select-Object code,enabled,@{Name='listingCount';Expression={$_.listingIds.Count}});anonymousAdminStatus=$adminStatus;publicConfigCacheControl=$response.Headers['Cache-Control'];rankedProductsResolvable=$true;rankedProductsOutsideCatalogWindow=$resolvedOutsideCatalog;images=$images;browserChecks=50;backendTests=59;authenticatedLiveBrowserVerified=$false}
$record | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $workspace 'outputs/storefront-sections-live-verification.json')
Write-Output 'Public storefront/admin bundles match the tested exports; six settings load; ranked products resolve; anonymous admin access is denied.'
