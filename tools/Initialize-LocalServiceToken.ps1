$ErrorActionPreference = 'Stop'

$directory = Join-Path $env:USERPROFILE '.sharity'
$path = Join-Path $directory 'local-internal-service.properties'
if (Test-Path -LiteralPath $path) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Expected a local service-token properties file at $path."
    }
    if ([System.IO.File]::ReadAllText($path) -notmatch
            '^app\.internal\.service-token=\$\{APP_INTERNAL_SERVICE_TOKEN:[a-f0-9]{64}\}\s*$') {
        throw "Existing local shared-token file is invalid at $path. Repair it before starting the services; it has not been overwritten."
    }
    Write-Host "Local shared-token file already exists at $path; it has not been changed."
    return
}

New-Item -ItemType Directory -Path $directory -Force | Out-Null
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $rng.GetBytes($bytes)
} finally {
    $rng.Dispose()
}
$token = -join ($bytes | ForEach-Object { $_.ToString('x2') })
$content = 'app.internal.service-token=${APP_INTERNAL_SERVICE_TOKEN:' + $token + '}'

# CreateNew prevents concurrent initializers from replacing a token already in use.
$stream = [System.IO.File]::Open($path, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write)
try {
    $acl = Get-Acl -LiteralPath $path
    $acl.SetAccessRuleProtection($true, $false)
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $identity, [System.Security.AccessControl.FileSystemRights]::FullControl,
        [System.Security.AccessControl.AccessControlType]::Allow)
    $acl.SetAccessRule($rule)
    Set-Acl -LiteralPath $path -AclObject $acl
    $encoded = [System.Text.Encoding]::ASCII.GetBytes($content + [Environment]::NewLine)
    $stream.Write($encoded, 0, $encoded.Length)
} finally {
    $stream.Dispose()
}
Write-Host "Created private local shared-token configuration at $path. Restart Authorization, Payment, Wallet and Marketplace."
