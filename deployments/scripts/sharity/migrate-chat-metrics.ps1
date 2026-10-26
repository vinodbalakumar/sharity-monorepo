$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$private=Join-Path $workspace ('.deployment-private/chat-metrics-'+(Get-Date -Format yyyyMMdd-HHmmss))
New-Item -ItemType Directory -Path $private -Force | Out-Null
$principal=[Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls $private '/inheritance:r' '/grant:r' "${principal}:(OI)(CI)F" 'SYSTEM:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Cannot restrict database backup directory.' }
$settings=@{}
Get-Content (Join-Path $deploy '.env.backend-local.properties') | ForEach-Object { if ($_ -match '^([A-Z_]+)=(.*)$') { $settings[$matches[1]]=$matches[2] } }
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$dump='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe'
$env:MYSQL_PWD=$settings.AUTH_DB_PASSWORD
try {
    & $dump '--host=127.0.0.1' '--port=3306' "--user=$($settings.AUTH_DB_USERNAME)" '--single-transaction' '--set-gtid-purged=OFF' '--no-tablespaces' '--column-statistics=0' "--result-file=$private\sharity-ai-before.sql" '--databases' 'sharity_ai'
    if ($LASTEXITCODE -ne 0) { throw 'AI database backup failed; migration was not applied.' }
    Get-Content -Raw (Join-Path $workspace 'platform-ai-service/src/main/resources/chat-schema.sql') | & $mysql '--host=127.0.0.1' '--port=3306' "--user=$($settings.AUTH_DB_USERNAME)" 'sharity_ai'
    if ($LASTEXITCODE -ne 0) { throw 'Additive chat metrics schema application failed.' }
    @{backupDirectory=$private;backupBytes=(Get-Item "$private\sharity-ai-before.sql").Length;table='ai_message_metrics';appliedAt=(Get-Date -Format o)} | ConvertTo-Json | Set-Content (Join-Path $workspace 'outputs/chat-info-migration.json')
    Write-Output 'AI database backed up; additive message metrics table applied. Existing messages preserved.'
} finally { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue }
