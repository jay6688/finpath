# V0 Architecture

**Status:** Implemented through EPS & Share Count plus Market Data Foundation v1
**Decision date:** 2026-08-19

## Outcome

V0 is one company, one authoritative financial-data source, and a controlled
set of connected learning slices:

> Apple/AAPL → Revenue and Profit → FY2025 Operating, Investing, and Financing Cash Flow → simple Free Cash Flow derivation → limitation → original SEC filing.

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

Market Data Foundation v1 adds a second, isolated backend trust domain:

```text
future server-side consumer
  â†’ MarketPriceService
  â†’ provider-neutral MarketDataProvider protocol
  â†’ Marketstack EOD adapter
  â†’ separate normalized SQLite cache
```

It has no public route or UI. SEC filing evidence is not reused for provider-
observed prices, and the market-data credential never reaches the browser.

## Applications

### `apps/web`

- Next.js App Router and TypeScript.
- Product shell and responsive company page.
- Curated, reviewed concept content.
- No financial values hard-coded as live data.
- V0 UI explicitly offers Apple/AAPL rather than pretending to search the full market.
- A seven-concept learning path through Net Profit Margin, Operating Cash Flow,
  Investing and Financing Cash Flow, and a simple Free Cash Flow derivation.
- Progressive lessons that keep Apple-reported statement lines distinct from
  FinPath-derived analytical metrics.

### `apps/api`

- FastAPI and Pydantic.
- SEC network adapter and ticker-to-CIK lookup.
- Revenue fact selection and deduplication.
- Coherent annual income-statement extraction anchored to one filing context,
  with explicit reconciliation failures instead of mixed or missing values.
- Coherent annual cash-flow extraction with three sections, reported net cash
  change, cash balances, and strict section/top-level/bridge reconciliation.
- An explicit reviewed company/fiscal-year cash-flow profile boundary, so a
  future company cannot silently inherit Apple's taxonomy and sign mapping.
- Separate SQLite caches for public SEC JSON and normalized market observations.
- A normalized API contract independent of SEC's raw JSON shape.

## Configuration and privacy

`SEC_USER_AGENT` is required before calling SEC. Local development loads it
from the Git-ignored project `.env`; an explicitly supplied process value wins.
It is intentionally blank in `.env.example`. A private email address must not
be committed or printed by startup tooling.

The default FinPath request policy is two upstream requests per second, below SEC's published maximum of ten. V0 does not collect or store user information.

Next.js and FastAPI bind to `127.0.0.1` during local development. Neither service is intentionally exposed to the LAN.

Market data is disabled by default. Provider connectivity and the public-
display licensing gate are separate settings; the latter remains false until
written redistribution/display clarification exists.

## Cache policy

| Resource | Fresh TTL | Stale-if-error |
|---|---:|---:|
| SEC ticker map | 24 hours | 7 days |
| Company Facts | 6 hours | 7 days |
| Historical market EOD observation | 24 hours | 7 days |

The response reports whether data is live or cached and when it was retrieved. A stale value is never presented as live.

Normal tests read trimmed SEC fixtures and synthetic provider-shaped market
fixtures. Separate `live` tests are skipped unless their explicit opt-in flag
and corresponding credential are supplied.

## Deferred deliberately

Authentication, PostgreSQL, Redis, Docker, queues, microservices, an AI Tutor, news, paper trading, gamification, PWA service workers, and multi-market data are outside V0.
