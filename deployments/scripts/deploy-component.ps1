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

$script = Join-Path $PSScriptRoot "deploy-component-with-rollback.ps1"
& $script `
  -WorkflowFrom $WorkflowFrom `
  -Component $Component `
  -DeployEnvironment $DeployEnvironment `
  -QaTarget $QaTarget `
  -TrafficMode $TrafficMode `
  -RollbackEnabled $RollbackEnabled `
  -RetryCount $RetryCount `
  -Mode $Mode
