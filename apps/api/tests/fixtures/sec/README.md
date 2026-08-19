# Trimmed SEC fixtures

These fixtures preserve the relevant shape of SEC's ticker map and Company Facts responses while retaining only the fields required by V0.

`aapl_companyfacts.json` proves Revenue tag selection, annual-period filtering, comparative-fact deduplication, and the complete FY2025 provenance chain. It intentionally includes a quarterly fact and an invalid short-duration fact so those filters are exercised. Do not replace it with an unexplained full Company Facts dump.
