# FinPath

FinPath is a beginner-first financial learning platform. V0 proves one narrow loop:

> Open FinPath → explore Apple (AAPL) → view real SEC Revenue history → understand what Revenue means → trace every number and explanation to a source.

The product does not tell users what to buy. V0 does not include authentication, an AI tutor, gamification, paper trading, news, trade execution, or PWA behavior.

## Repository status

This repository is currently at the **SEC Revenue pipeline milestone**. It contains:

- a runnable Next.js product shell and real-data Apple company page;
- a FastAPI company endpoint backed by SEC ticker and Company Facts data;
- annual Revenue normalization with complete filing provenance;
- a SQLite cache containing public SEC JSON only;
- sourced English and Chinese Revenue learning content;
- deterministic SEC fixtures and an optional live smoke test;
- architecture, data-contract, design-research, and product-brief documentation.

The UI never substitutes a hard-coded financial value when the API or SEC is unavailable.

## Prerequisites

- Node.js 20.9 or newer
- Python 3.12

FinPath uses the pnpm version pinned in `package.json` through Corepack. You do
not need to install pnpm globally, run `corepack enable`, use administrator
permissions, or approve LAN access.

## One-time setup

From the repository root (`D:\gpt work\finpath`), install the two applications:

```text
corepack pnpm install
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".\apps\api[dev]"
```

Copy `.env.example` to a new file named `.env`, then add a real project contact
to `SEC_USER_AGENT`. `.env` is ignored by Git. FinPath reads it without showing
the contact in startup output, and an explicitly supplied process environment
value still takes precedence.

## Recommended beginner startup

Double-click:

```text
scripts\start-finpath.cmd
```

You can run that same command from either Command Prompt or PowerShell. It:

1. checks Corepack, the Python environment, dependencies, `.env`, and ports;
2. starts FastAPI and waits for its health check;
3. starts Next.js and waits for the homepage;
4. opens `http://127.0.0.1:3000/` in the browser.

Keep the startup window open. Press Enter in it to stop only the API and web
process trees created by that launch. If the window was closed, run
`scripts\stop-finpath.cmd`; it verifies the recorded process ID, start time,
executable, and project directory before stopping anything.

Startup logs and the temporary process record live under the Git-ignored
`apps/api/var/` directory. Ports 3000 and 8000 must be free. If either is in
use, startup reports the port and stops without killing its owner.

## Manual startup — PowerShell

Open two PowerShell windows in the repository root. In the first:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8000 --reload
```

In the second:

```powershell
corepack pnpm dev:web
```

## Manual startup — Command Prompt

PowerShell commands such as `$env:NAME=...` do not work in Command Prompt.
They are not needed here because the API reads the project `.env` itself.

Open two Command Prompt windows. In each one, first run:

```bat
cd /d "D:\gpt work\finpath"
```

Then start the API in the first window:

```bat
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8000 --reload
```

Start the web app in the second:

```bat
corepack pnpm dev:web
```

Both servers bind only to `127.0.0.1`. Normal V0 development does not expose
them to the local network and should not require a Windows Firewall exception.

The root `.env` configures the API. The browser requests the Next.js page, and
the Next.js server calls FastAPI at a process-level `FINPATH_API_BASE_URL` when
one is supplied, otherwise at the built-in `http://127.0.0.1:8000` default. The
browser does not call FastAPI directly, so V0 does not enable CORS middleware.

## Checks

```powershell
corepack pnpm check:web
corepack pnpm test:web
.\.venv\Scripts\python.exe -m pytest apps/api/tests --basetemp apps/api/var/pytest
```

The normal API suite uses recorded, minimal SEC-shaped fixtures and never
makes a live SEC request. The optional live test also reads `SEC_USER_AGENT`
from the ignored project `.env`.

PowerShell:

```powershell
$env:FINPATH_RUN_LIVE_SEC_TEST="1"
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_live_sec_smoke.py -m live --basetemp apps/api/var/pytest-live
```

Command Prompt:

```bat
set FINPATH_RUN_LIVE_SEC_TEST=1
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_live_sec_smoke.py -m live --basetemp apps/api/var/pytest-live
```

## Preview deployment

The approved preview architecture uses two Vercel Hobby projects connected to
the same private GitHub repository: one for `apps/web` and one for `apps/api`.
The backend's SQLite file remains a disposable cache of public SEC responses;
no user data is stored there. Production configuration, secret handling,
project settings, and the public validation checklist are documented in
[`docs/preview-deployment.md`](docs/preview-deployment.md).

## Important documentation

- [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md)
- [`docs/v0-architecture.md`](docs/v0-architecture.md)
- [`docs/data-contract.md`](docs/data-contract.md)
- [`docs/design/research.md`](docs/design/research.md)
- [`docs/design/product-visual-direction.md`](docs/design/product-visual-direction.md)
