$ErrorActionPreference = "Stop"

$RepositoryRoot = Split-Path -Parent $PSScriptRoot
$ApiVarRoot = [System.IO.Path]::GetFullPath((Join-Path $RepositoryRoot "apps\api\var"))
$PytestBaseTemp = [System.IO.Path]::GetFullPath((
    Join-Path $ApiVarRoot ("pytest-" + [System.Guid]::NewGuid().ToString("N"))
))
$ExpectedTempPrefix = $ApiVarRoot.TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar,
    [System.IO.Path]::AltDirectorySeparatorChar
) + [System.IO.Path]::DirectorySeparatorChar

if (-not $PytestBaseTemp.StartsWith(
    $ExpectedTempPrefix,
    [System.StringComparison]::OrdinalIgnoreCase
)) {
    throw "Refusing to use a pytest temp directory outside apps/api/var."
}

Push-Location $RepositoryRoot
try {
    corepack pnpm check:web
    if ($LASTEXITCODE -ne 0) {
        throw "Web typecheck failed."
    }

    corepack pnpm test:web
    if ($LASTEXITCODE -ne 0) {
        throw "Web tests failed."
    }

    & ".\.venv\Scripts\python.exe" -m pytest apps/api/tests `
        --basetemp $PytestBaseTemp
    if ($LASTEXITCODE -ne 0) {
        throw "API tests failed."
    }
}
finally {
    if (Test-Path -LiteralPath $PytestBaseTemp) {
        Remove-Item -LiteralPath $PytestBaseTemp -Recurse -Force -ErrorAction SilentlyContinue
    }
    Pop-Location
}
