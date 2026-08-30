# V0 Architecture

**Status:** Implemented through the guided Apple Profit learning slice
**Decision date:** 2026-08-19

## Outcome

V0 is one company, one authoritative financial-data source, and a controlled
set of connected learning slices:

> Apple/AAPL → Revenue history → guided observation → FY2025 Profit path → limitation → original SEC filing.

## System boundary

```text
Browser
  → Next.js route
  → Next.js Server Component
  → loopback HTTP to FastAPI
  → SEC adapter
  → SEC ticker map + Company Facts JSON
  → SQLite public-data cache
  → normalization and provenance
  → Pydantic response
  → server-rendered React response
```

The browser does not call `data.sec.gov` directly because SEC does not support CORS. It also does not call FastAPI directly in V0: the Next.js server fetches the loopback API. FastAPI therefore has no CORS middleware. FastAPI owns SEC identification, request pacing, caching, normalization, and errors.

## Applications

### `apps/web`

- Next.js App Router and TypeScript.
- Product shell and responsive company page.
- Curated, reviewed concept content.
- No financial values hard-coded as live data.
- V0 UI explicitly offers Apple/AAPL rather than pretending to search the full market.
- A progressive FY2025 Profit lesson that keeps Apple-reported statement lines
  primary and treats Profit Margin as a preview only.

### `apps/api`

- FastAPI and Pydantic.
- SEC network adapter and ticker-to-CIK lookup.
- Revenue fact selection and deduplication.
- Coherent annual income-statement extraction anchored to one filing context,
  with explicit reconciliation failures instead of mixed or missing values.
- SQLite cache for public upstream data only.
- A normalized API contract independent of SEC's raw JSON shape.

## Configuration and privacy

`SEC_USER_AGENT` is required before calling SEC. Local development loads it
from the Git-ignored project `.env`; an explicitly supplied process value wins.
It is intentionally blank in `.env.example`. A private email address must not
be committed or printed by startup tooling.

The default FinPath request policy is two upstream requests per second, below SEC's published maximum of ten. V0 does not collect or store user information.

Next.js and FastAPI bind to `127.0.0.1` during local development. Neither service is intentionally exposed to the LAN.

## Cache policy

| Resource | Fresh TTL | Stale-if-error |
|---|---:|---:|
| SEC ticker map | 24 hours | 7 days |
| Company Facts | 6 hours | 7 days |

The response reports whether data is live or cached and when it was retrieved. A stale value is never presented as live.

Normal tests read trimmed, SEC-shaped JSON fixtures. A separate `live` test is skipped unless `FINPATH_RUN_LIVE_SEC_TEST=1` and `SEC_USER_AGENT` are both supplied.

## Deferred deliberately

Authentication, PostgreSQL, Redis, Docker, queues, microservices, an AI Tutor, news, paper trading, gamification, PWA service workers, and multi-market data are outside V0.
