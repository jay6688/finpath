# Market Cap Alignment Foundation

**Status:** Internal foundation implemented; no public route, lesson or UI
**Evidence reviewed:** 2026-09-22

## Decision

FinPath may derive a future point-in-time Market Cap only as:

```text
SEC-reported common shares outstanding on one date
* provider-observed raw closing price on that exact date
= FinPath-derived Market Cap snapshot
```

The calculation remains internal. `MARKET_DATA_PROVIDER=disabled` and
`MARKET_DATA_PUBLIC_DISPLAY_APPROVED=false` remain the production defaults.

## Reviewed SEC share-count matrix

| Company | Filing | Taxonomy and unit | Cover-page shares | Shares date | Filed | Market venue on shares date | Exact-date provider status | Internal alignment |
|---|---|---|---:|---|---|---|---|---|
| Apple | `0000320193-25-000079` | `dei:EntityCommonStockSharesOutstanding`, `shares` | 14,776,353,000 | 2025-10-17 | 2025-10-31 | Nasdaq / expected `XNAS` | Adapter supported; live date not verified | Supported with synthetic price input |
| Microsoft | `0001193125-26-323660` | `dei:EntityCommonStockSharesOutstanding`, `shares` | 7,425,545,491 | 2026-07-23 | 2026-07-29 | Nasdaq / expected `XNAS` | Adapter supported; live date not verified | Supported with synthetic price input |
| Walmart | `0000104169-26-000055` | `dei:EntityCommonStockSharesOutstanding`, `shares` | 7,972,402,501 | 2026-03-11 | 2026-03-13 | Nasdaq / expected `XNAS` | Provider identifier awaits live confirmation | Supported with synthetic price input |

Company Facts already normalizes these three facts as whole shares. FinPath
does not multiply the returned value by 1,000. In Apple's filing, the
`shares in thousands` presentation belongs to the EPS table's weighted-average
denominators, not to the cover-page shares-outstanding fact. The regression
contract therefore requires 14,776,353,000, not 14,776,353.

The reviewed cover pages describe one common-stock share count for each
company; the simple denominator is not being applied to an unresolved
multi-class structure.

## Point-in-time shares are not EPS shares

`EntityCommonStockSharesOutstanding` is an instant fact tied to the cover-page
date. It is not either of these duration facts:

- `WeightedAverageNumberOfSharesOutstandingBasic`
- `WeightedAverageNumberOfDilutedSharesOutstanding`

The EPS denominators cover a reporting period and remain owned by Lesson 11.
Market Cap alignment rejects them by taxonomy, date, accession and value.

## Exact-date alignment

The shares date, market-price date and derived snapshot date must be equal.
FinPath does not substitute fiscal-year end, filing date, today's price, a
nearby weekday, or the previous/next trading day. The provider's exact-date EOD
observation is the only accepted proof that a raw close exists for that date.

## Date-aware venue identity

A ticker is not a timeless security identity. A reviewed market profile now
contains non-overlapping venue periods, and the provider response must match
the venue resolved for the requested date.

Walmart's filing states:

- before 2025-12-09, its common stock was listed on the New York Stock Exchange;
- effective 2025-12-09, its principal listing is the Nasdaq Global Select Market.

The test boundary retains 2025-12-08 as the reviewed pre-transfer `XNYS` date
and resolves 2026-03-11 as `XNAS`. The latter identifier is a reviewed MIC
mapping from the SEC-confirmed venue, not a claim that a live Marketstack
response has already been inspected.

## Two trust domains and Decimal arithmetic

The derived snapshot preserves both inputs without merging their provenance:

- SEC input: CIK, fiscal year, instant date, form, filing date, accession,
  taxonomy and filing-index URL;
- market input: provider, provider symbol, date-resolved exchange, currency,
  retrieval state and raw closing price.

Shares are an exact integer. Price and the multiplication result are Python
`Decimal` values. No float conversion or display rounding occurs in the domain.
The provider's price precision is preserved in the exact result.

## Evidence limitations

The internal derived evidence can state that the result:

- is a point-in-time snapshot;
- uses reported shares and raw close from the same date;
- is FinPath-derived rather than company-reported;
- is not enterprise value;
- changes when the market price changes.

## Adding another company

A fourth company requires a reviewed cover-page share profile, filing identity,
whole-share unit, share-class assessment and date-aware market-security venue
profile. It reuses the same extraction, alignment and Decimal calculation code.

## Primary SEC sources

- [Apple FY2025 Form 10-K filing index](https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm)
- [Microsoft FY2026 Form 10-K filing index](https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/0001193125-26-323660-index.htm)
- [Walmart FY2026 Form 10-K filing index](https://www.sec.gov/Archives/edgar/data/104169/000010416926000055/0000104169-26-000055-index.htm)
- [SEC Company Facts API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)

Public Market Cap remains blocked until market-data display and redistribution
rights are explicitly cleared and the required exact-date provider identities
have been verified with an authorized live account.
