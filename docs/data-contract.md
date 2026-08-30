# V0 Data Contract

## Revenue history endpoint

```http
GET /v1/companies/{ticker}/overview
```

The infrastructure accepts a normalized ticker and performs a general ticker-to-CIK lookup. During V0, only `AAPL` is guaranteed by the product and integration-test suite.

## Response responsibilities

The API must provide:

- company identity;
- normalized Revenue metadata;
- annual observations;
- a source URL for every observation;
- live/cached status and retrieval time.

```json
{
  "company": {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "cik": "0000320193"
  },
  "metric": {
    "id": "revenue",
    "label": "Revenue",
    "currency": "USD",
    "taxonomyTag": "RevenueFromContractWithCustomerExcludingAssessedTax"
  },
  "series": [
    {
      "fiscalYear": 2025,
      "startDate": "2024-09-29",
      "endDate": "2025-09-27",
      "value": 416161000000,
      "form": "10-K",
      "filedAt": "2025-10-31",
      "accession": "0000320193-25-000079",
      "sourceUrl": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm"
    }
  ],
  "dataStatus": {
    "state": "live",
    "retrievedAt": "2026-08-19T00:00:00Z"
  }
}
```

## Revenue selection policy

1. Prefer `RevenueFromContractWithCustomerExcludingAssessedTax`.
2. Allow reviewed fallbacks `Revenues` and `SalesRevenueNet`.
3. Select USD annual facts from `10-K` or `10-K/A` with `fp == FY`.
4. Validate a plausible annual duration before accepting a fact.
5. Deduplicate repeated comparative facts by period end, retaining the latest filed version for the current-best-known view.
6. Return the five most recent fiscal years.
7. Preserve accession, form, filed date, fiscal period, taxonomy tag, and filing URL.
8. Return an explicit unsupported-data error instead of converting missing data to zero.

## Golden provenance assertion

The AAPL integration test must assert all of the following together:

```text
value       = 416161000000
fiscalYear  = 2025
endDate     = 2025-09-27
form        = 10-K
accession   = 0000320193-25-000079
filedAt     = 2025-10-31
sourceUrl   = valid SEC filing URL for that accession
```

The deterministic integration test now derives this complete assertion from a recorded, SEC-shaped Company Facts fixture. It does not rely on SEC network availability.

## Filing link construction

`sourceUrl` is derived only from the normalized CIK and accession:

```text
https://www.sec.gov/Archives/edgar/data/{CIK without leading zeroes}/{accession without hyphens}/{accession}-index.htm
```

The pipeline links to the official filing index and never guesses a company-controlled primary-document filename.

## Cache status

- `live`: this request retrieved the payload from SEC and stored it.
- `cached`: the payload was within its fresh TTL and no SEC call was made.
- `stale`: SEC refresh failed and a still-eligible last-known public payload was used.

`retrievedAt` always describes when the displayed upstream payload was retrieved, not when the browser rendered the page.

## FY income-statement endpoint

```http
GET /v1/companies/{ticker}/income-statements/{fiscal_year}
```

The Profit lesson uses this narrow statement contract. The API returns one
coherent annual filing context rather than selecting each line independently.
V0 guarantees the reviewed Apple FY2025 path only.

The ordered `statement.lines` are:

```text
Total net sales
- Total cost of sales
= Gross margin
- Total operating expenses
= Operating income
+ signed Other income/(expense), net
= Income before provision for income taxes
- Provision for income taxes
= Net income
```

Each line carries a stable FinPath id, SEC taxonomy tag and taxonomy label,
integer USD value, and presentation role. Deduction facts remain positive as
reported by Company Facts; `Other income/(expense), net` preserves its signed
value. Apple-specific display labels live in reviewed teaching content and are
rendered only when the returned fiscal year and accession match that content.

### Statement selection and reconciliation policy

1. Select the requested annual Revenue fact as the statement anchor.
2. Require every other fact to match its accession, start date, end date,
   fiscal year, form, and USD unit.
3. Collapse only identical duplicates. Reject conflicting duplicates, missing
   lines, and cross-filing combinations as unsupported instead of using zero.
4. Validate all four reported arithmetic relationships before responding.
5. Build one official SEC filing-index URL from CIK and accession and retain
   the shared filed date and period metadata.
6. Return the same `live`, `cached`, or `stale` retrieval status used by the
   Revenue endpoint.
