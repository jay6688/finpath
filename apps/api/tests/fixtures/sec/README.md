# Trimmed SEC fixtures

These fixtures preserve the relevant shape of SEC's ticker map and Company Facts responses while retaining only the fields required by V0.

`aapl_companyfacts.json` proves Revenue tag selection, annual-period filtering,
comparative-fact deduplication, and the complete FY2025 provenance chain. It
also retains the nine FY2025 facts required to reconcile Apple's Revenue to Net
income and the complete FY2025 cash-flow facts required to reconcile Operating,
Investing, Financing, the net cash change, and beginning-to-ending cash from one
filing context. The fixture intentionally includes a quarterly
Revenue fact, an invalid short-duration fact, a comparative Gross Profit fact,
and an identical duplicate Net Income fact so those boundaries remain tested.
Do not replace it with an unexplained full Company Facts dump.

`msft_companyfacts.json` preserves Microsoft's reviewed FY2026 Revenue history
and the nine same-context Income Statement facts required by the explicit
Microsoft FY2026 profile. Source: Microsoft Form 10-K filed 2026-07-29,
accession `0001193125-26-323660`.

`wmt_companyfacts.json` preserves Walmart's reviewed five-year Total revenues
history and a competing FY2026 Net sales fact. It proves that FinPath selects
the reviewed `Revenues` concept rather than relying on global taxonomy priority.
Source: Walmart Form 10-K filed 2026-03-13, accession
`0000104169-26-000055`.
