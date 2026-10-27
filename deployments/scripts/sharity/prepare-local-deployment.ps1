$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$release=Get-Date -Format 'yyyyMMdd-HHmmss'
$private=Join-Path $workspace ".deployment-private\$release"
New-Item -ItemType Directory -Path $private -Force | Out-Null
$principal=[Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls $private '/inheritance:r' '/grant:r' "${principal}:(OI)(CI)F" 'SYSTEM:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Cannot restrict backup directory permissions.' }
foreach ($name in @('.env','.env.backend-local.properties','docker-compose.yml','docker-compose.local.yml','nginx/nginx.conf')) {
    Copy-Item -LiteralPath (Join-Path $deploy $name) -Destination (Join-Path $private ($name.Replace('/','_')))
}
$settings=@{}
Get-Content (Join-Path $deploy '.env.backend-local.properties') | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.*)$') { $settings[$matches[1]]=$matches[2] }
}
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$dump='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe'
$dbUser=$settings.AUTH_DB_USERNAME
$databases=@('tesla')
foreach ($prefix in @('AUTH','MARKETPLACE','PAYMENT','WALLET','BFF')) {
    $url=$settings["${prefix}_DB_URL"]
    if ($url -match '^jdbc:mysql://[^/]+/([^?;]+)') { $databases += $matches[1] }
    else { throw "Invalid $prefix database URL; refusing deployment." }
}
$env:MYSQL_PWD=$settings.AUTH_DB_PASSWORD
try {
    $existingAiDatabase=& $mysql '--host=127.0.0.1' '--port=3306' "--user=$dbUser" '--batch' '--skip-column-names' "--execute=SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='sharity_ai';"
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inventory AI database for backup.' }
    if ($existingAiDatabase -eq 'sharity_ai') { $databases += 'sharity_ai' }
    & $dump '--host=127.0.0.1' '--port=3306' "--user=$dbUser" '--single-transaction' '--routines' '--triggers' '--events' '--set-gtid-purged=OFF' '--no-tablespaces' '--column-statistics=0' "--result-file=$private\databases.sql" '--databases' @($databases | Sort-Object -Unique)
    if ($LASTEXITCODE -ne 0) { throw 'Database backup failed; no containers were changed.' }
    if ((Get-Item "$private\databases.sql").Length -lt 1000) { throw 'Database backup is unexpectedly empty.' }
    $secretPath=Join-Path $deploy '.env.ai.local'
    if (-not (Test-Path -LiteralPath $secretPath)) {
        function New-PrivateToken {
            $bytes=New-Object byte[] 48
            $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
            try { $rng.GetBytes($bytes); [Convert]::ToBase64String($bytes) } finally { $rng.Dispose() }
        }
        $aiUser='sharity_ai_'+(Get-Date -Format 'MMddHHmmss')
        $aiPassword=New-PrivateToken
        $chatToken=New-PrivateToken
        $diagnosticToken=New-PrivateToken
        $sql="CREATE DATABASE IF NOT EXISTS sharity_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER '$aiUser'@'%' IDENTIFIED BY '$aiPassword'; GRANT SELECT,INSERT,UPDATE,DELETE ON sharity_ai.* TO '$aiUser'@'%';"
        $sql | & $mysql '--host=127.0.0.1' '--port=3306' "--user=$dbUser"
        if ($LASTEXITCODE -ne 0) { throw 'AI database/user provisioning failed.' }
        $secrets=@("CHAT_BFF_TOKEN=$chatToken","DIAGNOSTICS_TOKEN=$diagnosticToken","AI_DATABASE_USERNAME=$aiUser","AI_DATABASE_PASSWORD=$aiPassword",'AI_DATABASE_URL=jdbc:mysql://host.docker.internal:3306/sharity_ai?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC')
        [IO.File]::WriteAllLines($secretPath,$secrets)
        & icacls $secretPath '/inheritance:r' '/grant:r' "${principal}:F" 'SYSTEM:F' | Out-Null
    }
    $aiSettings=@{}
    Get-Content $secretPath | ForEach-Object { if ($_ -match '^([A-Z_]+)=(.*)$') { $aiSettings[$matches[1]]=$matches[2] } }
    Get-Content -Raw (Join-Path $workspace 'platform-ai-service/src/main/resources/chat-schema.sql') | & $mysql '--host=127.0.0.1' '--port=3306' "--user=$dbUser" 'sharity_ai'
    if ($LASTEXITCODE -ne 0) { throw 'AI schema validation/application failed.' }
} finally { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue }
$rollback=@()
foreach ($service in @('authorization-server','marketplace-service','payment-service','wallet-service','platform-web-bff','sharity-app','sharity-admin-portal','nginx')) {
    $container="sharity-local-$service-1"
    $raw=docker inspect $container
    if ($LASTEXITCODE -ne 0) { throw "Cannot inspect $service for rollback." }
    [IO.File]::WriteAllText((Join-Path $private "$service.inspect.json"),($raw -join "`n"))
    $inspection=($raw -join "`n") | ConvertFrom-Json
    $tag="${service}:rollback-$release"
    docker image tag $inspection[0].Image $tag
    if ($LASTEXITCODE -ne 0) { throw "Cannot preserve $service image." }
    $rollback += [pscustomobject]@{ service=$service; image=$inspection[0].Image; rollbackTag=$tag }
}
$state=[pscustomobject]@{ release=$release; backupDirectory=$private; databaseBackupBytes=(Get-Item "$private\databases.sql").Length; rollback=$rollback }
[IO.File]::WriteAllText((Join-Path $workspace 'outputs/local-deployment-state.json'),($state | ConvertTo-Json -Depth 6))
Write-Output ("Prepared release {0}; database backup {1:N0} bytes; {2} rollback images. Secrets remain private." -f $release,$state.databaseBackupBytes,$rollback.Count)
