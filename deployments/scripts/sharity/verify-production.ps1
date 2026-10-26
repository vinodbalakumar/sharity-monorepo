param([switch]$NativeExports, [switch]$BrowserTests)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
function Invoke-Check([string]$Directory, [string]$Executable, [string[]]$Arguments) {
    Push-Location (Join-Path $workspace $Directory)
    try {
        $ErrorActionPreference = 'Continue'
        & $Executable @Arguments
        $code = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        if ($code -ne 0) { throw "$Directory verification failed: $Executable $Arguments" }
    } finally { Pop-Location }
}
foreach ($module in @('authorization-server','marketplace-service','payment-service','wallet-service','platform-web-bff','tesla-dashboard-services','platform-ai-service')) {
    Invoke-Check $module 'mvn.cmd' @('-B','-ntp','verify')
}
Invoke-Check '.' 'python' @((Join-Path $PSScriptRoot 'extract-maven-dependencies.py'))
Invoke-Check '.' 'node' @((Join-Path $PSScriptRoot 'scan-maven-osv.mjs'))
Invoke-Check 'sharity-app-ui' 'npm.cmd' @('ci')
Invoke-Check 'sharity-app-ui' 'npm.cmd' @('run','typecheck')
Invoke-Check 'sharity-app-ui' 'npm.cmd' @('run','lint')
Invoke-Check 'sharity-app-ui' 'npm.cmd' @('run','check:expo')
Invoke-Check 'sharity-app-ui' 'npm.cmd' @('run','build:web')
if ($NativeExports) {
    Invoke-Check 'sharity-app-ui' 'npm.cmd' @('run','export:android')
    Invoke-Check 'sharity-app-ui' 'npm.cmd' @('run','export:ios')
}
if ($BrowserTests) {
    Invoke-Check 'sharity-app-ui' 'npm.cmd' @('run','test:assets')
    Invoke-Check 'sharity-app-ui' 'npm.cmd' @('run','build:e2e')
    Invoke-Check 'sharity-app-ui' 'npx.cmd' @('playwright','install','chromium','firefox','webkit')
    Invoke-Check 'sharity-app-ui' 'npm.cmd' @('run','test:e2e')
}
# Fail visibly on remaining advisories; never claim a clean security gate by suppressing them.
Invoke-Check 'sharity-app-ui' 'npm.cmd' @('audit','--audit-level=moderate')
