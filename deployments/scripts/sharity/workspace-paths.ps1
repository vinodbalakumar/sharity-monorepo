function Get-SharityWorkspaceRoot {
    $candidate = $env:SHARITY_WORKSPACE_ROOT
    if ([string]::IsNullOrWhiteSpace($candidate)) {
        $candidate = Join-Path $PSScriptRoot '../../../springbootrestdemo'
    }
    $resolved = [IO.Path]::GetFullPath($candidate)
    if (-not (Test-Path -LiteralPath $resolved -PathType Container)) {
        throw 'Set SHARITY_WORKSPACE_ROOT to the directory containing the Sharity component checkouts.'
    }
    New-Item -ItemType Directory -Path (Join-Path $resolved 'outputs') -Force | Out-Null
    return $resolved
}
