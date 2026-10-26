param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$ollama = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
if (-not (Test-Path -LiteralPath $ollama)) { throw 'Install Ollama from https://ollama.com/download/windows first.' }
if ([string]::IsNullOrWhiteSpace($env:CHAT_BFF_TOKEN) -or $env:CHAT_BFF_TOKEN.Length -lt 32) {
    throw 'Set CHAT_BFF_TOKEN to the same randomly generated secret (32+ characters) in your BFF and AI service terminals. Do not commit it.'
}
& $ollama list
if ($LASTEXITCODE -ne 0) { throw 'Start Ollama before starting Sharity AI.' }
Push-Location (Join-Path $workspace 'platform-ai-service')
try {
    if (-not $SkipBuild) { & mvn -B -ntp package -DskipTests; if ($LASTEXITCODE -ne 0) { throw 'AI service build failed.' } }
    & java '-Xmx512m' '-jar' 'target/platform-ai-service-0.0.1-SNAPSHOT.jar' '--spring.profiles.active=chat-local'
    if ($LASTEXITCODE -ne 0) { throw 'AI service exited with an error.' }
} finally { Pop-Location }
