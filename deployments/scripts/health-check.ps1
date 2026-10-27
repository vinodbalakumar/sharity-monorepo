param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,
  [string]$Path = "/",
  [int]$TimeoutSeconds = 60,
  [int]$IntervalSeconds = 3
)

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$url = ($BaseUrl.TrimEnd('/') + $Path)

while ((Get-Date) -lt $deadline) {
  try {
    Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10 | Out-Null
    Write-Host "healthy: $url"
    exit 0
  } catch {
    Start-Sleep -Seconds $IntervalSeconds
  }
}

Write-Error "health check timed out: $url"
exit 1
