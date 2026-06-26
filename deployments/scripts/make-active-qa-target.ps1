param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("windows", "mac", "linux")]
  [string]$Target,
  [string]$Component = "all",
  [string]$StateDir = (Join-Path $PWD ".state")
)

New-Item -ItemType Directory -Force -Path $StateDir | Out-Null
$stateFile = Join-Path $StateDir "active-qa-target.txt"
Set-Content -Path $stateFile -Value $Target

Write-Host "QA routing plan"
Write-Host "active_target=$Target"
Write-Host "component=$Component"
Write-Host "state_file=$stateFile"
