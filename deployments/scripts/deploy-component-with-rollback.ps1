param(
  [string]$WorkflowFrom = "claude_cop_patch",
  [ValidateSet("authorization-server", "marketplace-service", "payment-service", "wallet-service", "platform-web-bff", "sharity-app-ui", "all")]
  [string]$Component = "all",
  [ValidateSet("qa", "prod")]
  [string]$DeployEnvironment = "qa",
  [ValidateSet("windows", "mac", "linux")]
  [string]$QaTarget = "mac",
  [ValidateSet("deploy_only", "make_active")]
  [string]$TrafficMode = "deploy_only",
  [ValidateSet("true", "false")]
  [string]$RollbackEnabled = "true",
  [ValidateSet("1", "2", "3")]
  [string]$RetryCount = "3",
  [ValidateSet("plan", "apply")]
  [string]$Mode = "plan"
)

$rootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if ($Mode -ne "apply") {
  Write-Host "Rollback-aware deployment plan"
  Write-Host "workflow_from=$WorkflowFrom"
  Write-Host "component=$Component"
  Write-Host "deploy_environment=$DeployEnvironment"
  Write-Host "qa_target=$QaTarget"
  Write-Host "traffic_mode=$TrafficMode"
  Write-Host "rollback_enabled=$RollbackEnabled"
  Write-Host "retry_count=$RetryCount"
  exit 0
}

Write-Warning "Apply mode is scaffolded but not executed by default."
Write-Host "If you later wire a self-hosted runner, this script can be extended to run the compose deployment."
