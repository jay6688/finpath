# FinPath

FinPath is a beginner-first financial learning platform. V0 proves one narrow loop:

> Open FinPath → explore Apple (AAPL) → view real SEC Revenue history → understand what Revenue means → trace every number and explanation to a source.

The product does not tell users what to buy. V0 does not include authentication, an AI tutor, gamification, paper trading, news, trade execution, or PWA behavior.

## Repository status

This repository is currently at the **scaffold milestone**. It contains:

- a runnable Next.js product shell;
- a runnable FastAPI health endpoint;
- the V0 API/provenance schemas;
- sourced English and Chinese Revenue learning content;
- architecture, data-contract, design-research, and product-brief documentation.

The SEC network adapter and Revenue extraction pipeline are intentionally the next milestone. The current UI does not display a hard-coded financial value as if it were live data.

## Prerequisites

- Node.js 20.9 or newer
- pnpm 10
- Python 3.12

## Local setup

Copy `.env.example` to `.env` and supply a declared SEC `User-Agent` before the SEC integration milestone. Use a project contact address rather than a private email address.

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
python -m uvicorn app.main:app --app-dir apps/api --reload
```

Open `http://127.0.0.1:8000/health`.

### Checks

```powershell
pnpm check:web
python -m pytest apps/api/tests
```

## Important documentation

- [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md)
- [`docs/v0-architecture.md`](docs/v0-architecture.md)
- [`docs/data-contract.md`](docs/data-contract.md)
- [`docs/design/research.md`](docs/design/research.md)

