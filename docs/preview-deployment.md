# Preview deployment

FinPath V0 uses two Vercel projects connected to the same private GitHub
repository. This keeps the existing application boundary intact:

```text
Browser
  -> Next.js project
  -> FastAPI project
  -> SEC data.sec.gov
```

The browser never calls FastAPI directly. Next.js reads
`FINPATH_API_BASE_URL` on the server and makes the API request, so CORS is not
enabled for the preview deployment.

## Project 1: FastAPI

Create a Vercel project from the repository with these settings:

- Root Directory: `apps/api`
- Framework Preset: Other
- Production Branch: `main`
- Build and install commands: use Vercel defaults

Configure these environment variables for Production and Preview:

```text
SEC_USER_AGENT=<project name and real project contact>
SEC_REQUESTS_PER_SECOND=2
SEC_COMPANY_FACTS_TTL_SECONDS=21600
SEC_TICKER_MAP_TTL_SECONDS=86400
SEC_STALE_IF_ERROR_SECONDS=604800
SEC_CACHE_PATH=/tmp/finpath-sec-cache.sqlite3
FINPATH_API_DOCS_ENABLED=false
```

`SEC_USER_AGENT` is a deployment secret. Never paste its value into source,
deployment logs, screenshots, or issue reports.

Vercel runs `index.py` as the ASGI entrypoint. `vercel.json` caps a request at
60 seconds, which is the Hobby-plan maximum. The health endpoint remains
available at `/health`; FastAPI's interactive `/docs`, `/redoc`, and
`/openapi.json` endpoints are disabled publicly.

The SQLite file is only a cache of public SEC responses. Vercel stores it in
the function's writable `/tmp` directory. It can disappear between function
instances, cold starts, and deployments, and FinPath rebuilds it from SEC when
needed. It must not be treated as persistent storage or used for user data.

## Project 2: Next.js

Create a second Vercel project from the same repository:

- Root Directory: `apps/web`
- Framework Preset: Next.js
- Production Branch: `main`
- Build and install commands: use Vercel defaults

Configure this server-only environment variable for Production and Preview:

```text
FINPATH_API_BASE_URL=https://<the FastAPI project>.vercel.app
```

The value must be an absolute HTTPS URL in production. It deliberately does
not use a `NEXT_PUBLIC_` prefix, so it is not bundled into browser JavaScript.
Local development keeps using `http://127.0.0.1:8000` when no value is supplied.

## Cost and rollback boundary

Both projects use the Vercel Hobby plan. Do not enable a Pro trial, paid add-on,
analytics product, custom domain, or usage-based upgrade for this preview.
Vercel Git integration creates deployments from commits on `main`; use the
project deployment history to promote a previously working deployment if a
rollback is needed.

## Required validation

After both projects are deployed, verify:

1. `/health` returns the FinPath API health response over HTTPS.
2. `/` and `/company/aapl` load over HTTPS.
3. FY2025 Revenue is `$416.2B` and the five-year history appears.
4. The latest source link opens the official SEC filing index.
5. the production page does not request `localhost`.
6. no SEC contact value appears in HTML, browser JavaScript, console output, or
   publicly visible logs.
7. mobile has no horizontal overflow and its bottom navigation does not cover
   the final content.
8. an unavailable API produces FinPath's readable missing-data state.
9. local startup and the normal test/build suite still pass.
