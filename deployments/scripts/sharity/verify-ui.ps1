param([switch]$SkipExports)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$results = [System.Collections.Generic.List[object]]::new()
Push-Location (Join-Path $workspace 'sharity-app-ui')
try {
    $checks = @('typecheck','lint','check:expo','test:assets')
    if (-not $SkipExports) { $checks += @('build:web','build:e2e','export:android','export:ios') }
    $checks += 'test:e2e'
    foreach ($check in $checks) {
        $fileName = $check.Replace(':','-')
        $ErrorActionPreference = 'Continue'
        & npm.cmd run $check *> "../outputs/final-ui-$fileName.log"
        $code = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        $results.Add([pscustomobject]@{ check = $check; exitCode = $code; log = "outputs/final-ui-$fileName.log" })
        Write-Output "$check exit=$code"
        $results | ConvertTo-Json | Set-Content '../outputs/ui-verification.json' -Encoding UTF8
        if ($code -ne 0 -and $check -ne 'test:e2e') { exit $code }
    }
    $ErrorActionPreference = 'Continue'
    & npm.cmd audit --json > '../outputs/ui-audit.json'
    $auditCode = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    $results.Add([pscustomobject]@{ check = 'npm audit'; exitCode = $auditCode; log = 'outputs/ui-audit.json' })
    $results | ConvertTo-Json | Set-Content '../outputs/ui-verification.json' -Encoding UTF8
    if (@($results | Where-Object { $_.exitCode -ne 0 }).Count) { exit 1 }
} finally { Pop-Location }
