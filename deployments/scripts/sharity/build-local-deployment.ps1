$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$state=Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
function Build-ReleaseImage([string]$image,[string]$dockerfile,[string]$context,[string]$name,[string]$source) {
    Write-Output "BUILDING $name"
    $arguments=@('build','--progress=plain','--label',"sharity.release=$($state.release)",'--label',"sharity.source=$source",'-t',$image,'-f',$dockerfile,$context)
    $process=Start-Process -FilePath 'docker.exe' -ArgumentList $arguments -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace "outputs/deploy-build-$name.out.log") -RedirectStandardError (Join-Path $workspace "outputs/deploy-build-$name.log")
    if ($process.ExitCode -ne 0) { throw "Image build failed for $name; see its deployment build log." }
}
foreach ($module in @('authorization-server','marketplace-service','payment-service','wallet-service','platform-web-bff','platform-ai-service','tesla-dashboard-services')) {
    $context=Join-Path $workspace $module
    $jar=Get-ChildItem (Join-Path $context 'target') -Filter '*.jar' | Select-Object -First 1
    if (-not $jar) { throw "No built artifact for $module" }
    if (@(Get-ChildItem (Join-Path $context 'src/main') -Recurse -File | Where-Object LastWriteTime -GT $jar.LastWriteTime).Count -gt 0) {
        throw "$module has source newer than its artifact. Verify it first."
    }
    $image="${module}:release-$($state.release)"
    Build-ReleaseImage $image (Join-Path $deploy 'dockerfiles/verified-java.Dockerfile') $context $module 'local-verified-artifact'
    Write-Output "BUILT $module"
}
Build-ReleaseImage "sharity-app:release-$($state.release)" (Join-Path $deploy 'dockerfiles/verified-web.Dockerfile') (Join-Path $workspace 'sharity-app-ui') 'sharity-app' 'verified-expo-export'
Write-Output 'BUILT sharity-app; all release images ready.'
