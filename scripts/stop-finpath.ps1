$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$StateFile = Join-Path $RepoRoot "apps\api\var\finpath-processes.json"

function Stop-RecordedProcess {
    param([object]$Record)

    $process = Get-Process -Id ([int]$Record.pid) -ErrorAction SilentlyContinue
    if ($null -eq $process) {
        return 0
    }

    try {
        $actualTicks = $process.StartTime.ToUniversalTime().Ticks
        $actualPath = $process.MainModule.FileName
    }
    catch {
        Write-Warning "Could not verify recorded PID $($Record.pid). It was not stopped."
        return -1
    }

    $samePath = [System.StringComparer]::OrdinalIgnoreCase.Equals(
        $actualPath,
        [string]$Record.executablePath
    )
    if ($actualTicks -ne [long]$Record.startedAtUtcTicks -or -not $samePath) {
        Write-Warning "Skipped PID $($Record.pid): it is no longer the process FinPath started."
        return -1
    }

    $taskkill = Join-Path $env:SystemRoot "System32\taskkill.exe"
    $result = Start-Process -FilePath $taskkill `
        -ArgumentList @("/PID", [string]$Record.pid, "/T", "/F") `
        -WindowStyle Hidden -Wait -PassThru
    if ($result.ExitCode -ne 0) {
        Write-Warning "Could not stop the recorded $($Record.name) process tree."
        return -1
    }
    return 1
}

if (-not (Test-Path -LiteralPath $StateFile -PathType Leaf)) {
    Write-Host "FinPath is not recorded as running. Nothing was stopped."
    exit 0
}

try {
    $state = Get-Content -Raw -LiteralPath $StateFile | ConvertFrom-Json
    if ($state.projectRoot -ne $RepoRoot) {
        throw "The startup record belongs to a different project directory. Nothing was stopped."
    }

    $stopped = 0
    $cleanupSucceeded = $true
    foreach ($record in @($state.processes) | Sort-Object { if ($_.name -eq "web") { 0 } else { 1 } }) {
        $result = Stop-RecordedProcess -Record $record
        if ($result -eq 1) {
            $stopped += 1
        }
        elseif ($result -lt 0) {
            $cleanupSucceeded = $false
        }
    }

    if (-not $cleanupSucceeded) {
        throw "One or more recorded processes could not be verified or stopped. The startup record was kept."
    }

    Remove-Item -LiteralPath $StateFile -Force
    Write-Host "Stopped $stopped FinPath process tree(s)."
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
