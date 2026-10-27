param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deployment = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$config = (Join-Path $deployment 'config/ai/').Replace('\','/')
$modelServer = if ($env:OLLAMA_BASE_URL) { $env:OLLAMA_BASE_URL } else { 'http://192.168.0.149:11434' }
if ([string]::IsNullOrWhiteSpace($env:CHAT_BFF_TOKEN) -or $env:CHAT_BFF_TOKEN.Length -lt 32) {
    throw 'Set CHAT_BFF_TOKEN to the same randomly generated secret (32+ characters) in your BFF and AI service terminals. Do not commit it.'
}
$models = Invoke-RestMethod "$modelServer/api/tags" -TimeoutSec 10
if ('qwen3:8b' -notin $models.models.name) { throw 'Mac Ollama must already contain qwen3:8b. No model download was attempted.' }
$env:APP_CHAT_CATALOG_LOCATION = 'file:' + (Join-Path $deployment 'knowledge/catalog.json').Replace('\','/')
Push-Location (Join-Path $workspace 'platform-ai-service')
try {
    if (-not $SkipBuild) { & mvn -B -ntp package -DskipTests; if ($LASTEXITCODE -ne 0) { throw 'AI service build failed.' } }
    & java '-Xmx512m' '-jar' 'target/platform-ai-service-0.0.1-SNAPSHOT.jar' "--spring.config.additional-location=file:$config" '--spring.profiles.active=chat-local'
    if ($LASTEXITCODE -ne 0) { throw 'AI service exited with an error.' }
} finally { Pop-Location }
