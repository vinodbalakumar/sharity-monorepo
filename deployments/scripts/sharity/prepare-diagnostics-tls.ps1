$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'workspace-paths.ps1')
$workspace = Get-SharityWorkspaceRoot
$deploy=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$state=Get-Content (Join-Path $workspace 'outputs/local-deployment-state.json') -Raw | ConvertFrom-Json
$tls=Join-Path $state.backupDirectory 'tls'
New-Item -ItemType Directory -Path $tls -Force | Out-Null
function Run-Tool([string]$Executable,[string[]]$Arguments,[string]$Step) {
    $process=Start-Process -FilePath $Executable -ArgumentList $Arguments -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput (Join-Path $tls "$Step.out.log") -RedirectStandardError (Join-Path $tls "$Step.err.log")
    if ($process.ExitCode -ne 0) { throw "TLS setup step $Step failed; private log retained." }
}
$keytool='C:\Program Files\Java\jdk-21\bin\keytool.exe'
$javac='C:\Program Files\Java\jdk-21\bin\javac.exe'
$openssl='C:\Program Files\Git\usr\bin\openssl.exe'
$bytes=New-Object byte[] 32
$rng=[Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($bytes); $env:SHARITY_TLS_PASSWORD=[Convert]::ToBase64String($bytes) } finally { $rng.Dispose() }
try {
    if (-not (Test-Path (Join-Path $tls 'server.key'))) {
        Run-Tool $keytool @('-genkeypair','-alias','diagnostics','-keyalg','RSA','-keysize','2048','-validity','365','-dname','CN=platform-web-bff','-ext','SAN=dns:platform-web-bff','-ext','EKU=serverAuth','-storetype','PKCS12','-keystore',"$tls/server.p12",'-storepass:env','SHARITY_TLS_PASSWORD','-keypass:env','SHARITY_TLS_PASSWORD') 'generate-key'
        Run-Tool $keytool @('-exportcert','-rfc','-alias','diagnostics','-keystore',"$tls/server.p12",'-storepass:env','SHARITY_TLS_PASSWORD','-file',"$tls/server.crt") 'export-cert'
        Run-Tool $openssl @('pkcs12','-in',"$tls/server.p12",'-passin','env:SHARITY_TLS_PASSWORD','-nocerts','-nodes','-out',"$tls/server.key") 'export-key'
    }
} finally { Remove-Item Env:SHARITY_TLS_PASSWORD -ErrorAction SilentlyContinue }
if (-not (Test-Path "$tls/java-cacerts")) {
    $temp="sharity-cacerts-$($state.release)"
    Run-Tool 'docker.exe' @('create','--name',$temp,"authorization-server:release-$($state.release)") 'create-cacerts-source'
    try { Run-Tool 'docker.exe' @('cp',"${temp}:/opt/java/openjdk/lib/security/cacerts","$tls/java-cacerts") 'copy-jre-cacerts' }
    finally { Run-Tool 'docker.exe' @('rm',$temp) 'remove-cacerts-source' }
    Run-Tool $keytool @('-importcert','-trustcacerts','-noprompt','-alias','sharity-private-diagnostics','-file',"$tls/server.crt",'-keystore',"$tls/java-cacerts",'-storepass','changeit') 'trust-private-cert'
}
Run-Tool $javac @('-d',$tls,(Join-Path $PSScriptRoot 'TlsProbe.java')) 'compile-tls-probe'
$settings=@(Get-Content (Join-Path $deploy '.env.ai.local') | Where-Object { $_ -notmatch '^SHARITY_TLS_DIR=' })
$settings += 'SHARITY_TLS_DIR='+$tls.Replace('\','/')
[IO.File]::WriteAllLines((Join-Path $deploy '.env.ai.local'),$settings)
Write-Output 'Private diagnostic TLS certificate and JVM trust store prepared; public CA roots preserved.'
