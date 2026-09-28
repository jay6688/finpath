# FinPath V1 release-candidate QA report

- **QA date:** 2026-09-28
- **Baseline:** `32d64a9048e5eb27d94017d9075d27c59487abc8`
- **Scope:** Company Analysis Basics, 15 lessons
**Status:** Ready for real novice testing after the release-hardening fixes in this milestone are deployed

This report records engineering and product-behavior verification. It does not
claim that novice comprehension has been validated.

## Environment and automated baseline

- Windows, Node.js 24.13.0, pnpm 11.19.0, Python 3.12.14
- Next.js 16.3.3 and sharp 0.35.4
- Baseline Web suite: 122/122 passed
- Baseline API suite: 182 passed, 2 opt-in live tests skipped
- Next route generation, TypeScript and production build passed
- Production dependency audit: no known high or critical vulnerabilities

The API suite must be run from `apps/api` or with its configured test path. A
root-level unscoped `pytest apps/api` also discovers protected historical cache
folders under `apps/api/var`; that command-context failure is not a product
failure.

## V1 route and support matrix

Global routes cover Home, Learn, Explore and the AAPL, MSFT and WMT company
pages. The canonical path contains exactly 15 lessons.

| Lesson / capability | AAPL FY2025 | MSFT FY2026 | WMT FY2026 |
|---|---:|---:|---:|
| Revenue | Reviewed | Reviewed | Reviewed |
| Revenue Growth | Reviewed | Reviewed | Reviewed |
| Profit lesson | Reviewed | Not presented in V1 | Not reviewed |
| Net Profit Margin lesson | Reviewed | Not presented in V1 | Not reviewed |
| Cash Flow lessons | Reviewed | Not reviewed | Not reviewed |
| Balance Sheet | Reviewed | Reviewed | Reviewed |
| Cash & Debt | Reviewed | Reviewed | Reviewed |
| Three Statements | Reviewed | Not reviewed | Not reviewed |
| EPS & Share Count | Reviewed | Reviewed | Reviewed |
| Market Cap lesson | Reviewed shares + learner price | Same | Same |
| P/E lesson | Reviewed annual EPS + learner price | Same | Same |
| Business Model | Reviewed filing narrative | Reviewed filing narrative | Reviewed filing narrative |
| Capstone | Reviewed | Not supported | Not supported |

Unsupported combinations fail with explicit unavailable states or API 422
responses. QA did not broaden coverage merely to fill the matrix.

## Route, navigation and responsive coverage

- All 21 core routes were loaded at 1440px, 390px and 320px: 63 page checks.
- Every checked page had one main landmark, one H1 and no horizontal overflow.
- A fresh 390px session completed the full Home -> Learn -> Lessons 1-15 ->
  Home -> Learn -> Explore journey through real lesson interactions. No
  localStorage or developer-tool shortcut was used.
- Deep 320px interaction covered Revenue, Profit, Balance Sheet, EPS, Market
  Cap, P/E, Business Model and Capstone.
- Deep 1440px interaction covered Home/Learn, Three Statements, EPS, Business
  Model, Capstone and an Explore company page.
- Previous/next navigation, Home completion, Learn completion, company
  selection, refresh-safe URL state and Apple-only Capstone behavior remained
  coherent. Direct `?company=msft`, `?company=wmt` and unsupported Capstone
  queries showed canonical Apple content without cross-company labels.
- No browser console warnings or errors were observed during the completed
  local flows.

## Progress-state audit

The storage contract remains `finpath.learning-progress`, version 1.

Automated checks cover fresh, 1-4, 1-10, 1-14, complete, legacy V1, unknown
IDs, duplicate IDs, malformed JSON, method-level storage exceptions and a
browser that blocks access to the `localStorage` property itself. Completion
normalizes to the canonical lesson order and company switching is not stored as
learning progress.

The provider listens for same-key `StorageEvent` changes. A real two-tab check
was inconclusive because the QA browser isolates storage contexts between its
automation tabs; event delivery across two ordinary browser tabs remains a
targeted manual verification item, not a confirmed defect.

## Financial and evidence consistency

Apple FY2025 values remained identical across their source lessons, evidence
inspectors and Capstone. Reported, derived, verification, narrative,
educational-input and unknown states retained distinct labels.

Independent arithmetic confirmed:

- Revenue Growth: `(416.161 - 391.035) / 391.035 = 6.425512%` (display 6.4%)
- Net Profit Margin: `112.010 / 416.161 = 26.915064%` (display 26.9%)
- simple FCF: `111.482 - 12.715 = 98.767` billion USD
- cash sections: `111.482 + 15.195 - 120.686 = 5.991` billion USD
- ending cash: `29.943 + 5.991 = 35.934` billion USD
- balance sheet: `285.508 + 73.733 = 359.241` billion USD
- simple borrowings: `7.979 + 12.350 + 78.328 = 98.657` billion USD
- Basic EPS verification: `112.010B / 14.9485B = 7.49` after stated rounding
- Diluted EPS verification: `112.010B / 15.004697B = 7.46` after stated rounding
- Walmart derived liabilities: `178.488` billion USD; including other claims
  and equity reconciles to `284.668` billion USD of assets
- educational Market Cap at a learner-entered `$100`: `$1.4776353T`
- educational P/E at `$100 / $7.46`: `13.4x`

No calculation uses rounded display values as hidden inputs. Net Income remains
an accounting result, FCF remains a FinPath-defined analytical measure, and
Balance Sheet, EPS, Market Cap, P/E and Business Model boundaries remain
explicit.

## Provenance and broken states

Representative production pages preserved HTTPS SEC filing-index links,
accession `0000320193-25-000079`, FY2025 and Form 10-K identity. Business Model
uses reviewed filing narrative rather than presenting narrative as Company
Facts data.

Production records exposed distinct period, filing and retrieval dates. Normal
automated tests remain fixture-backed and do not require live SEC access.
Malformed payload, filing mismatch, cross-company mismatch, missing required
evidence and stale-cache behavior are covered by deterministic tests.

With FastAPI deliberately stopped, the company route originally returned 500.
It now returns an honest readable unavailable state and no financial values.
Optional evidence continues to degrade locally, while Capstone-required
evidence fails closed.

## Accessibility scope

Inspected output included a skip link, semantic navigation/main/regions,
logical headings, labelled inputs, native fieldset/legend groups, accessible
button names, `aria-pressed`, status/alert regions and visible focus CSS. Color
is not the only signal used for lesson state.

The QA browser exposed the accessibility tree, but its keyboard-event injection
did not activate focused controls reliably. A full keyboard-only Market Cap or
P/E lesson and Capstone run is therefore unverified rather than passed. Actual
screen-reader user experience is also unverified; no certification is claimed.

## Market-data isolation and security sanity

- `MARKET_DATA_PROVIDER=disabled`
- `MARKET_DATA_PUBLIC_DISPLAY_APPROVED=false`
- no browser Marketstack request, public market-price endpoint, provider-backed
  Market Cap endpoint or provider-backed P/E endpoint
- production `/v1/market-data/AAPL` and `/v1/companies/AAPL/market-cap` return 404
- Lessons 12 and 13 use clearly labelled learner-entered educational prices
- Capstone contains no current price or current valuation conclusion
- `.env` is ignored; no committed provider key or SEC contact value was found
- FastAPI public docs remain disabled in production configuration

## Production smoke before the hardening deployment

The deployed Web home, Learn, Explore, three company pages and all 15 lesson
routes returned HTTP 200. API health, registry and every V1-supported public
financial endpoint returned 200. Unsupported WMT income statement and MSFT/WMT
cash-flow endpoints returned 422. No public market-price or Market Cap endpoint
was found.

Final post-push smoke results and the exact release SHA are recorded in the
milestone closeout report rather than retroactively editing this commit.

## Confirmed defects and fixes

| Severity | Defect | Root cause | Fix | Regression |
|---|---|---|---|---|
| P1, resolved | Privacy-restricted browsers could crash progress initialization when merely accessing `window.localStorage` threw. | Storage method failures were handled, but the property getter was not. | Added a guarded browser-storage accessor and used it for reads, writes and storage-event sync. | Blocked-property test plus full progress suite. |
| P1, resolved | A company page returned HTTP 500 when the API registry was unreachable. | Registry retrieval occurred outside the existing data-error boundaries. | Added a fail-closed route state that shows no financial values. | Source contract test plus real API-off HTTP check. |

No P0 defect was found. No unresolved P1 remains.

## Remaining uncertainty

- **P2 verification gap:** real keyboard-only completion is not confirmed due
  to QA browser event-injection limits; semantic inspection found no confirmed
  trap or inaccessible control.
- **P2 verification gap:** real cross-tab progress synchronization is not
  confirmed because automated tabs had isolated storage contexts.
- **P3 research question:** evidence density and lesson length may still feel
  heavy to a novice. This needs observation, not a speculative rewrite.
- **P3 research question:** users may confuse weighted-average EPS shares with
  point-in-time shares despite the explicit boundary.
- Actual novice comprehension and screen-reader experience are unverified.

## Release-candidate conclusion

The engineering gate is green once the milestone commit is deployed and its
post-deploy smoke passes: no open P0, no unresolved P1, full automated suites
and build green, canonical routes healthy, evidence consistent, full progress
path completed, 320px without a blocking layout issue, and market-data
isolation intact.

**FinPath V1 is ready for real novice testing.**
