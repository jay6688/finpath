param(
    [switch]$NoBrowser,
    [switch]$StopAfterReady
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
Set-StrictMode -Version Latest

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$PythonExe = Join-Path $RepoRoot ".venv\Scripts\python.exe"
$EnvFile = Join-Path $RepoRoot ".env"
$WebDependency = Join-Path $RepoRoot "apps\web\node_modules\next\package.json"
$RuntimeDir = Join-Path $RepoRoot "apps\api\var"
$LogDir = Join-Path $RuntimeDir "logs"
$StateFile = Join-Path $RuntimeDir "finpath-processes.json"
$OwnedProcesses = [System.Collections.Generic.List[object]]::new()
$StateFileOwnedByThisRun = $false
$StartupMutex = $null
$OwnsStartupMutex = $false

function New-RepositoryMutex {
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    try {
        $pathBytes = [System.Text.Encoding]::UTF8.GetBytes($RepoRoot.ToLowerInvariant())
        $hashBytes = $hasher.ComputeHash($pathBytes)
    }
    finally {
        $hasher.Dispose()
    }

    $pathHash = ([System.BitConverter]::ToString($hashBytes)).Replace("-", "")
    return [System.Threading.Mutex]::new(
        $false,
        "Local\FinPath-$($pathHash.Substring(0, 16))"
    )
}

function Test-PortAvailable {
    param([int]$Port)

    $listener = [System.Net.Sockets.TcpListener]::new(
        [System.Net.IPAddress]::Loopback,
        $Port
    )
    try {
        $listener.Start()
        return $true
    }
    catch [System.Net.Sockets.SocketException] {
        return $false
    }
    finally {
        $listener.Stop()
    }
}

function New-ProcessRecord {
    param([string]$Name, [System.Diagnostics.Process]$Process)

    $Process.Refresh()
    return [pscustomobject]@{
        name = $Name
        pid = $Process.Id
        startedAtUtcTicks = $Process.StartTime.ToUniversalTime().Ticks
        executablePath = $Process.MainModule.FileName
    }
}

function Save-ProcessState {
    $state = [ordered]@{
        projectRoot = $RepoRoot
        processes = $OwnedProcesses.ToArray()
    }
    $state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $StateFile -Encoding UTF8
}

function Stop-OwnedProcess {
    param([object]$Record)

    $process = Get-Process -Id ([int]$Record.pid) -ErrorAction SilentlyContinue
    if ($null -eq $process) {
        return $true
    }

    try {
        $actualTicks = $process.StartTime.ToUniversalTime().Ticks
        $actualPath = $process.MainModule.FileName
    }
    catch {
        Write-Warning "Could not verify recorded PID $($Record.pid). It was not stopped."
        return $false
    }

    $samePath = [System.StringComparer]::OrdinalIgnoreCase.Equals(
        $actualPath,
        [string]$Record.executablePath
    )
    if ($actualTicks -ne [long]$Record.startedAtUtcTicks -or -not $samePath) {
        Write-Warning "Skipped PID $($Record.pid): it is no longer the process FinPath started."
        return $false
    }

    $taskkill = Join-Path $env:SystemRoot "System32\taskkill.exe"
    $result = Start-Process -FilePath $taskkill `
        -ArgumentList @("/PID", [string]$Record.pid, "/T", "/F") `
        -WindowStyle Hidden -Wait -PassThru
    if ($result.ExitCode -ne 0) {
        Write-Warning "Could not stop the recorded $($Record.name) process tree."
        return $false
    }
    return $true
}

function Wait-ForEndpoint {
    param(
        [string]$Name,
        [uri]$Uri,
        [System.Diagnostics.Process]$Process,
        [int]$TimeoutSeconds = 45
    )

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
        $Process.Refresh()
        if ($Process.HasExited) {
            throw "$Name stopped before it became ready. See the logs in $LogDir."
        }

        try {
            $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                return
            }
        }
        catch {
            # The service may still be starting; retry until the deadline.
        }

        Start-Sleep -Milliseconds 500
    }

    throw "$Name did not become ready within $TimeoutSeconds seconds. See the logs in $LogDir."
}

$exitCode = 0
Push-Location $RepoRoot
try {
    Write-Host "FinPath local startup"
    Write-Host "Checking this computer..."

    $StartupMutex = New-RepositoryMutex
    try {
        $OwnsStartupMutex = $StartupMutex.WaitOne(0)
    }
    catch [System.Threading.AbandonedMutexException] {
        $OwnsStartupMutex = $true
    }
    if (-not $OwnsStartupMutex) {
        throw "Another FinPath startup is already in progress or running."
    }

    if (-not (Test-Path -LiteralPath $PythonExe -PathType Leaf)) {
        throw "Python environment not found. Create .venv and install apps/api[dev] first."
    }
    if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) {
        throw "Missing .env. Copy .env.example to .env and add the SEC project contact."
    }
    if (-not (Test-Path -LiteralPath $WebDependency -PathType Leaf)) {
        throw "Web dependencies are missing. Run: corepack pnpm install"
    }

    $corepack = Get-Command corepack.cmd -ErrorAction SilentlyContinue
    if ($null -eq $corepack) {
        throw "Corepack was not found. Install a supported Node.js version, then try again."
    }

    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($null -eq $node) {
        throw "Node.js was not found. Install Node.js 20.9 or newer, then try again."
    }

    & $PythonExe -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)"
    if ($LASTEXITCODE -ne 0) {
        throw "FinPath requires Python 3.12 or newer."
    }
    & $node.Source -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 20 || (major === 20 && minor >= 9) ? 0 : 1)"
    if ($LASTEXITCODE -ne 0) {
        throw "FinPath requires Node.js 20.9 or newer."
    }

    & $PythonExe -c "import app, dotenv, fastapi, httpx, uvicorn" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw 'API dependencies are missing. Run: .\.venv\Scripts\python.exe -m pip install -e ".\apps\api[dev]"'
    }

    & $PythonExe -c "from app.core.settings import Settings; settings = Settings.from_project_environment(); raise SystemExit(0 if settings.sec_user_agent else 2)" 2>$null
    if ($LASTEXITCODE -eq 2) {
        throw "SEC_USER_AGENT is blank in .env. Add a real project contact, then try again."
    }
    if ($LASTEXITCODE -ne 0) {
        throw "FinPath could not load .env. Check that its setting values are valid."
    }

    if (Test-Path -LiteralPath $StateFile) {
        throw "A previous FinPath startup record exists. Run scripts\stop-finpath.cmd, then try again."
    }
    foreach ($port in @(8000, 3000)) {
        if (-not (Test-PortAvailable -Port $port)) {
            throw "Port $port is already in use. Close that program, or run scripts\stop-finpath.cmd if it is FinPath."
        }
    }

    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

    Write-Host "Starting API on http://127.0.0.1:8000 ..."
    $apiProcess = Start-Process -FilePath $PythonExe `
        -ArgumentList @(
            "-m", "uvicorn", "app.main:app",
            "--app-dir", "apps/api",
            "--host", "127.0.0.1",
            "--port", "8000"
        ) `
        -WorkingDirectory $RepoRoot `
        -RedirectStandardOutput (Join-Path $LogDir "api.out.log") `
        -RedirectStandardError (Join-Path $LogDir "api.err.log") `
        -WindowStyle Hidden -PassThru
    $apiRecord = New-ProcessRecord -Name "api" -Process $apiProcess
    $OwnedProcesses.Add($apiRecord)
    Save-ProcessState
    $StateFileOwnedByThisRun = $true
    Wait-ForEndpoint -Name "API" -Uri "http://127.0.0.1:8000/health" -Process $apiProcess
    Write-Host "API is ready."

    Write-Host "Starting web app on http://127.0.0.1:3000 ..."
    # Keep cmd.exe as a stable parent so taskkill /T can later stop only this
    # launch's Corepack/Next process tree.
    $webProcess = Start-Process -FilePath $env:ComSpec `
        -ArgumentList @("/d", "/c", "corepack pnpm --dir apps/web dev") `
        -WorkingDirectory $RepoRoot `
        -RedirectStandardOutput (Join-Path $LogDir "web.out.log") `
        -RedirectStandardError (Join-Path $LogDir "web.err.log") `
        -WindowStyle Hidden -PassThru
    $webRecord = New-ProcessRecord -Name "web" -Process $webProcess
    $OwnedProcesses.Add($webRecord)
    Save-ProcessState
    Wait-ForEndpoint -Name "Web app" -Uri "http://127.0.0.1:3000/" -Process $webProcess
    Write-Host "Web app is ready."

    if (-not $NoBrowser) {
        try {
            Start-Process "http://127.0.0.1:3000/"
        }
        catch {
            Write-Warning "The browser could not open automatically. Open http://127.0.0.1:3000/ yourself."
        }
    }

    if ($StopAfterReady) {
        Write-Host "Readiness check passed."
    }
    else {
        Write-Host ""
        Write-Host "FinPath is running. Keep this window open."
        Write-Host "Press Enter here to stop only the API and web app started above."
        Read-Host | Out-Null
    }
}
catch {
    $exitCode = 1
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    $cleanupSucceeded = $true
    if ($OwnedProcesses.Count -gt 0) {
        Write-Host "Stopping FinPath..."
        foreach ($record in @($OwnedProcesses.ToArray()) | Sort-Object { if ($_.name -eq "web") { 0 } else { 1 } }) {
            if (-not (Stop-OwnedProcess -Record $record)) {
                $cleanupSucceeded = $false
            }
        }
    }
    if ($StateFileOwnedByThisRun -and $cleanupSucceeded -and (Test-Path -LiteralPath $StateFile)) {
        Remove-Item -LiteralPath $StateFile -Force
    }
    elseif ($StateFileOwnedByThisRun -and -not $cleanupSucceeded) {
        $exitCode = 1
        Write-Warning "Startup ownership record kept at $StateFile so cleanup can be retried."
    }
    if ($OwnsStartupMutex) {
        $StartupMutex.ReleaseMutex()
    }
    if ($null -ne $StartupMutex) {
        $StartupMutex.Dispose()
    }
    Pop-Location
}

if ($exitCode -eq 0) {
    Write-Host "FinPath stopped."
}
exit $exitCode
