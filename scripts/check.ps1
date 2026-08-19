$ErrorActionPreference = "Stop"

Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    pnpm check:web
    pnpm test:web
    python -m pytest apps/api/tests
}
finally {
    Pop-Location
}

