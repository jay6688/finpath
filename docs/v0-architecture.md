# V0 Architecture

**Status:** Approved for scaffold  
**Decision date:** 2026-08-19

## Outcome

V0 is one learning loop, two screens, one metric, and one authoritative financial-data source:

> Apple/AAPL → Revenue history → beginner explanation → limitation → original SEC filing.

## System boundary

```text
Browser
  → Next.js / React
  → HTTP to FastAPI
  → SEC adapter
  → SEC ticker map + Company Facts JSON
  → normalization and provenance
  → Pydantic response
  → React render
```

The browser does not call `data.sec.gov` directly because SEC does not support CORS. FastAPI owns SEC identification, request pacing, caching, normalization, and errors.

## Applications

### `apps/web`

- Next.js App Router and TypeScript.
- Product shell and responsive company page.
- Curated, reviewed concept content.
- No financial values hard-coded as live data.
- V0 UI explicitly offers Apple/AAPL rather than pretending to search the full market.

### `apps/api`

- FastAPI and Pydantic.
- SEC network adapter and ticker-to-CIK lookup.
- Revenue fact selection and deduplication.
- SQLite cache for public upstream data only.
- A normalized API contract independent of SEC's raw JSON shape.

## Configuration and privacy

`SEC_USER_AGENT` is required before calling SEC. It is supplied through the environment and is intentionally blank in `.env.example`. A private email address must not be committed.

The default FinPath request policy is two upstream requests per second, below SEC's published maximum of ten. V0 does not collect or store user information.

## Cache policy

| Resource | Fresh TTL | Stale-if-error |
|---|---:|---:|
| SEC ticker map | 24 hours | 7 days |
| Company Facts | 6 hours | 7 days |

The response reports whether data is live or cached and when it was retrieved. A stale value is never presented as live.

## Deferred deliberately

Authentication, PostgreSQL, Redis, Docker, queues, microservices, an AI Tutor, news, paper trading, gamification, PWA service workers, and multi-market data are outside V0.

