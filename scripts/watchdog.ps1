<#
.SYNOPSIS
    Morabbi watchdog - keeps backend (:3010) and frontend (:4210) running.

.DESCRIPTION
    Every check-interval seconds it verifies that the backend and frontend ports
    are listening. If a service is down, it (re)starts it in a hidden window and
    logs the action. Press Ctrl+C to stop the watchdog.

.PARAMETER Interval
    Seconds between checks (default 15).

.PARAMETER BackendOnly
    Watch only the backend.

.PARAMETER FrontendOnly
    Watch only the frontend.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\watchdog.ps1
#>
param(
    [int]$Interval = 15,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$Root = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"
$LogDir = Join-Path $Root "logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
$LogPath = Join-Path $LogDir "watchdog.log"

$WatchBackend = -not $FrontendOnly
$WatchFrontend = -not $BackendOnly

function Write-Log([string]$Message) {
    $line = "{0:yyyy-MM-dd HH:mm:ss}  {1}" -f (Get-Date), $Message
    Add-Content -Path $LogPath -Value $line -Encoding UTF8
    Write-Host $line
}

function Test-PortListening([int]$Port) {
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
        $listener.Start()
        $listener.Stop()
        return $false
    }
    catch [System.Net.Sockets.SocketException] {
        return $true
    }
    catch {
        return $false
    }
}

function Start-Backend {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "dotnet"
    $psi.Arguments = "run --no-build --project src\EducationalPlatform.Morabbi.API"
    $psi.WorkingDirectory = $BackendDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8
    $proc = [System.Diagnostics.Process]::Start($psi)
    Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
        $e = $EventSenderArguments
        Add-Content -Path $script:BackendLog -Value $e.Data -Encoding UTF8 -ErrorAction SilentlyContinue
    } | Out-Null
    Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
        $e = $EventSenderArguments
        Add-Content -Path $script:BackendErrLog -Value $e.Data -Encoding UTF8 -ErrorAction SilentlyContinue
    } | Out-Null
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()
    return $proc
}

function Start-Frontend {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    if ($IsWindows -or $env:OS -eq "Windows_NT") {
        $psi.FileName = "cmd.exe"
        $psi.Arguments = "/c npm start"
    }
    else {
        $psi.FileName = "sh"
        $psi.Arguments = "-c npm start"
    }
    $psi.WorkingDirectory = $FrontendDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8
    $proc = [System.Diagnostics.Process]::Start($psi)
    Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
        $e = $EventSenderArguments
        Add-Content -Path $script:FrontendLog -Value $e.Data -Encoding UTF8 -ErrorAction SilentlyContinue
    } | Out-Null
    Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
        $e = $EventSenderArguments
        Add-Content -Path $script:FrontendErrLog -Value $e.Data -Encoding UTF8 -ErrorAction SilentlyContinue
    } | Out-Null
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()
    return $proc
}

$BackendLog = Join-Path $LogDir "backend.out"
$BackendErrLog = Join-Path $LogDir "backend.err"
$FrontendLog = Join-Path $LogDir "frontend.out"
$FrontendErrLog = Join-Path $LogDir "frontend.err"

Write-Log "Watchdog started (interval=${Interval}s, backend=$WatchBackend, frontend=$WatchFrontend)"

# Build backend once at startup so restarts are fast and reliable.
if ($WatchBackend) {
    Write-Log "Building backend (dotnet build)..."
    Push-Location $BackendDir
    try {
        dotnet build --nologo -v q *> $null
        if ($LASTEXITCODE -ne 0) { Write-Log "WARNING: backend build failed; run may not start" }
    }
    finally { Pop-Location }
}

# Cooldowns: starting the services takes longer than the check interval
# (dotnet ~20s, ng serve first compile ~60s). Without a cooldown the loop
# would spawn a new instance every tick and they would fight for the port.
$lastBackendStart = [DateTime]::MinValue
$lastFrontendStart = [DateTime]::MinValue
$backendStartupCooldown = 60
$frontendStartupCooldown = 90

while ($true) {
    if ($WatchBackend) {
        if (Test-PortListening 3010) {
            $lastBackendStart = [DateTime]::MinValue
        }
        elseif (((Get-Date) - $lastBackendStart).TotalSeconds -ge $backendStartupCooldown) {
            Write-Log "Backend :3010 is DOWN - starting dotnet run..."
            try { Start-Backend | Out-Null; $lastBackendStart = Get-Date; Write-Log "Backend start issued." }
            catch { Write-Log "Backend start FAILED: $($_.Exception.Message)" }
        }
    }
    if ($WatchFrontend) {
        if (Test-PortListening 4210) {
            $lastFrontendStart = [DateTime]::MinValue
        }
        elseif (((Get-Date) - $lastFrontendStart).TotalSeconds -ge $frontendStartupCooldown) {
            Write-Log "Frontend :4210 is DOWN - starting npm start..."
            try { Start-Frontend | Out-Null; $lastFrontendStart = Get-Date; Write-Log "Frontend start issued." }
            catch { Write-Log "Frontend start FAILED: $($_.Exception.Message)" }
        }
    }
    Start-Sleep -Seconds $Interval
}
