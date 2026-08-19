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
- pnpm 10
- Python 3.12

## Local setup

Supply a declared SEC `User-Agent` to the API process. Use a project contact address rather than committing a private email address. `.env.example` documents the available configuration, but the application reads process environment variables directly.

### Web

```powershell
pnpm install
pnpm dev:web
```

Open `http://localhost:3000`.

### API

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".\apps\api[dev]"
$env:SEC_USER_AGENT="FinPath/0.1 project-contact@example.com"
python -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8000 --reload
```

Open `http://127.0.0.1:8000/health`, or inspect `http://127.0.0.1:8000/v1/companies/AAPL/overview`.

Both development servers bind to loopback by default. Normal V0 development does not expose either service to the local network and should not require a Windows Firewall exception.

The browser requests the Next.js page, and the Next.js server calls FastAPI at `FINPATH_API_BASE_URL`. The browser does not call FastAPI directly, so V0 does not enable CORS middleware.

### Checks

```powershell
pnpm check:web
pnpm test:web
python -m pytest apps/api/tests
```

The normal API suite uses recorded, minimal SEC-shaped fixtures and never makes a live SEC request. To run the optional smoke test deliberately:

```powershell
$env:SEC_USER_AGENT="FinPath/0.1 project-contact@example.com"
$env:FINPATH_RUN_LIVE_SEC_TEST="1"
python -m pytest apps/api/tests/test_live_sec_smoke.py -m live
```

## Important documentation

- [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md)
- [`docs/v0-architecture.md`](docs/v0-architecture.md)
- [`docs/data-contract.md`](docs/data-contract.md)
- [`docs/design/research.md`](docs/design/research.md)
