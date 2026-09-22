# Market Data Provider Foundation

**Status:** Implemented foundation; provider disabled; public display unapproved
**Research reviewed:** 2026-09-22

## Decision

FinPath now has a provider-neutral market-price domain with a first
Marketstack end-of-day adapter. It is backend infrastructure only: there is no
public price endpoint, browser request, price card, chart, Market Cap lesson/UI,
or P/E feature. An internal Market Cap alignment domain now exists but cannot
expose provider data.

SEC filing facts and market observations remain separate trust domains:

```text
SEC evidence
  = company-reported filing facts and filing provenance

Market-data evidence
  = a provider-observed price for one exact trading date

Internal derived metric
  = a separately identified FinPath calculation using explicit inputs
```

Marketstack is an adapter, not the domain model. A replacement provider should
require a new adapter and reviewed security profiles, not a rewrite of the
Market Cap alignment domain.

## Why end-of-day raw close

Foundation v1 asks for one historical closing observation on one exact date.
It deliberately excludes real-time and intraday data. The normalized value is
Marketstack's `close`, identified as `priceType = close` and
`adjustment = raw`. `adj_close` is never substituted when raw `close` is
missing.

The service never uses `latest`, nearest-date selection, interpolation, or
automatic previous/next trading-day fallback. A date without an exact
observation fails closed. Choosing how a non-trading filing date maps to a
market date belongs to a future product milestone.

## Reviewed security boundary

Foundation v1 accepts only bounded, date-aware provider profiles:

| FinPath ticker | Marketstack symbol | Reviewed dates | Expected exchange/MIC | Currency |
|---|---|---|---|---|
| AAPL | AAPL | From 2025-09-26 | XNAS | USD |
| MSFT | MSFT | From 2026-06-30 | XNAS | USD |
| WMT | WMT | 2025-12-08 | XNYS | USD |
| WMT | WMT | From 2025-12-09 | XNAS | USD |

Ticker text alone is not treated as a globally unique security identity. The
adapter requires the exact profile symbol and exchange. A live integration
must continue to validate the returned provider identifiers; arbitrary ticker
input remains unsupported.

Walmart's FY2026 Form 10-K states that its principal listing moved from NYSE
to the Nasdaq Global Select Market effective 2025-12-09. FinPath therefore
resolves the expected exchange from the requested price date rather than from
a timeless ticker mapping. The SEC listing change is confirmed; Marketstack's
post-transfer `XNAS` response identifier still awaits inspection with an
authorized live key.

## Decimal and serialization

Provider JSON numbers are parsed with Python `Decimal` support before any
price arithmetic. FinPath never builds a canonical price with
`Decimal(float_value)`. Prices must be finite and greater than zero.

The internal `MarketPriceSnapshot` serializes its Decimal price as a JSON
string (for example, `"123.45"`) so downstream code does not reintroduce a
binary floating-point artifact.

## Cache semantics

Market data uses a separate SQLite file and table from the SEC JSON cache. It
stores only the normalized observation and provenance fields; it never stores
the provider key or full response payload.

| State | Meaning |
|---|---|
| `live` | Fetched from the provider and normalized during this request. |
| `cached` | Served from a record no older than the 24-hour refresh policy. |
| `stale` | Refresh failed; a last-known normalized record no older than seven days was returned with its original retrieval time. |

Historical data is not cached forever because a provider can correct it. A
stale record is never labelled live.

## Credential boundary

`MARKETSTACK_ACCESS_KEY` is read only by the FastAPI process. The adapter sends
it as a separately constructed HTTPS request parameter because that is how
Marketstack authenticates the API. FinPath does not log the expanded provider
URL, return provider error bodies, place the key in normalized snapshots, or
persist it in SQLite.

Normal startup needs no Marketstack configuration:

```text
MARKET_DATA_PROVIDER=disabled
MARKETSTACK_ACCESS_KEY=
MARKET_DATA_PUBLIC_DISPLAY_APPROVED=false
```

Provider connectivity and public-display approval are separate controls.

## Licensing gate

As reviewed on 2026-09-22, Marketstack's pricing page advertised End-of-Day
Data and one year of history on Free with `Non-Commercial Use`, while Basic
advertised 10 years of history and `Commercial Use`. Those plan details can
change.

`Commercial Use` is not, by itself, affirmative evidence that FinPath may
redistribute or publicly display provider-derived closing prices to website
visitors. The service agreement reviewed did not clearly resolve that right.

The required written clarification is:

> Does the Marketstack Basic plan permit a public educational website to
> display end-of-day closing prices retrieved from the API to website visitors?

Until the provider answers affirmatively in writing:

- `MARKET_DATA_PUBLIC_DISPLAY_APPROVED=false` remains the committed default;
- no public market-price endpoint or UI may be enabled;
- no Vercel market-data secret is required or added;
- local adapter development, synthetic fixtures, and an explicitly enabled
  one-request live smoke test are the only approved uses.

## Testing boundary

Normal tests use clearly synthetic provider-shaped fixtures. Values such as
`123.45` are schema and normalization inputs, not historical facts and must
never enter product content.

The optional live test runs only when both are present:

```text
FINPATH_RUN_LIVE_MARKET_DATA_TEST=1
MARKETSTACK_ACCESS_KEY=<local secret>
```

It checks exact-date identity, raw-close semantics, Decimal handling and
credential isolation; it does not assert an unreviewed historical price.

## Official sources reviewed

- Marketstack API documentation: <https://docs.apilayer.com/marketstack/docs/api-endpoints-v1>
- Marketstack EOD request/response example: <https://marketstack.com/find-ticker-symbol>
- Marketstack pricing: <https://marketstack.com/pricing>
- Marketstack service agreement: <https://marketstack.com/agreement>
- Marketstack contact: <https://marketstack.com/contact>
