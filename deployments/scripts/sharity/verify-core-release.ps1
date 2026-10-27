param([ValidateSet('authorization-server','marketplace-service','payment-service','wallet-service','platform-web-bff')][string[]]$Modules = @('authorization-server','marketplace-service','payment-service','wallet-service','platform-web-bff'))
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$maven = (Get-Command mvn.cmd).Source
foreach ($module in $Modules) {
    Push-Location (Join-Path $workspace $module)
    try {
        # Windows PowerShell otherwise treats JVM stderr warnings as terminating errors.
        $ErrorActionPreference = 'Continue'
        & $maven -B -ntp clean verify *> (Join-Path $workspace "outputs/publish-$module.log")
        $code = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        if ($code -ne 0) { throw "$module verification failed; inspect its publish log." }
        Write-Output "$module verification passed"
    } finally { $ErrorActionPreference = 'Stop'; Pop-Location }
}
