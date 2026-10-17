# Copy backlog

Wording that is accurate but likely to confuse beginners. These are copy
items, not confirmed data defects. Fix them deliberately, with the owner,
rather than as a side effect of other work.

## Evidence inspector fallback reads like broken data

- Where: `apps/web/src/components/evidence-inspector.tsx`, the
  `evidence-fallback` paragraph (shared, so it appears in any inspector whose
  reported fact has no reviewed statement presentation, for example Total
  Liabilities in the Cash & Debt lesson).
- Current text: "FinPath can trace this number to the SEC filing, but a
  reviewed statement presentation for this company is unavailable for this
  record. …"
- Problem: "unavailable" suggests the number itself is missing or broken. In
  fact the value is traced to the filing; only the company-specific filing
  label and statement context are not shown.
- Origin: introduced in `f02a972` (2026-09-03, "simplify evidence inspector
  for beginners"); not part of the marketable-securities change `65e3bae`.
- Direction: say plainly that the number is verified against the SEC filing,
  and that only the company's own statement wording and layout are not
  recreated here. Keep the truth boundary: do not imply a reviewed
  presentation exists.
