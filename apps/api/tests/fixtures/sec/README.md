# Trimmed SEC fixtures

These fixtures preserve the relevant shape of SEC's ticker map and Company Facts responses while retaining only the fields required by V0.

`aapl_companyfacts.json` proves Revenue tag selection, annual-period filtering,
comparative-fact deduplication, and the complete FY2025 provenance chain. It
also retains the nine FY2025 facts required to reconcile Apple's Revenue to Net
income from one filing context. The fixture intentionally includes a quarterly
Revenue fact, an invalid short-duration fact, a comparative Gross Profit fact,
and an identical duplicate Net Income fact so those boundaries remain tested.
Do not replace it with an unexplained full Company Facts dump.
