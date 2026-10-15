# FinPath — Claude Code instructions

FinPath is a beginner-first (not beginner-only) financial-learning and
real-company-research web app. It teaches people to reason from financial
evidence. It must never tell users what to buy or sell.

Adapted from the owner's Codex collaboration standard (`~/.codex/AGENTS.md`)
and the FinPath migration context. System, safety and permission instructions
take precedence. More specific directory instructions (for example
`apps/web/CLAUDE.md` → `apps/web/AGENTS.md`) specialize this file.

## Truth priority

**Real repository + Git > docs > migration summaries > old chats.**

- The root `README.md` still says "V1 Capstone implemented"; it is stale as a
  description of the frontend. `docs/production-v2-release.md` and Git history
  record the later Production V2 release.
- Branch names, file presence and commit history do not prove stakeholder
  approval. Treat approval as externally managed unless the owner states it.

## Preflight before any code change

1. Check the current branch, exact HEAD and working-tree status.
2. Read the relevant source files and their tests.
3. Read any directory-specific `CLAUDE.md` / `AGENTS.md`.
4. Identify the confirmed problem, approved scope and non-goals.

`D:\gpt work` is a broader personal workspace, not the Git root. Do not edit
files outside `D:\gpt work\finpath` unless asked.

## Repository layout

- `apps/web` — Next.js 16 App Router, React 19, TypeScript. Owns learning
  presentation, reviewed teaching content (`src/content`), evidence display,
  responsive interaction and local learning progress. It must not become a
  second financial-data authority.
  - **This Next.js version has breaking changes.** Before writing web code,
    read the relevant guide in `apps/web/node_modules/next/dist/docs/`.
- `apps/api` — FastAPI + Pydantic. Owns SEC ticker→CIK lookup, Company Facts
  access, request pacing, normalization, reviewed company profiles,
  reconciliation, provenance, caching and unsupported-data errors.
- The browser calls Next.js only; Next.js server code calls FastAPI. There is no
  CORS middleware by design.
- SQLite cache holds public SEC JSON only, never user data.
- `docs/` — architecture, data contract, market-data, design and QA records.

## Canonical contracts — do not change by accident

- Lesson catalog and order: `apps/web/src/lib/lesson-catalog.ts` (15 lessons,
  `revenue` … `capstone`).
- Progress: `apps/web/src/lib/learning-progress.ts`. Storage key
  `finpath.learning-progress`, schema version `1`, ordered
  `exploredConceptIds`. Before hydration progress is
  `{ isHydrated: false, progress: null }`; an unhydrated visitor must not be
  shown as a fresh learner.
- Each lesson has its own completion trigger. Inspect it and adjacent-lesson
  navigation before changing a lesson.
- Reviewed companies: `apps/api/app/domain/company_registry.py` (AAPL FY2025,
  MSFT FY2026, WMT FY2026, with different capabilities). Do not duplicate this
  registry elsewhere, and never infer a capability because a ticker is
  supported for another lesson.

A visual redesign must not change lesson IDs or order, the progress key or
format, hydration, completion semantics or previous/next routing.

## Financial truth rules

- **Reported ≠ Derived ≠ Learner input.** Keep evidence roles distinct.
  Educational prices in Market Cap and P/E are not market prices.
- **Unknown, unavailable and zero are different.** Missing data never becomes 0.
- **No hardcoded financial fallback.** If the API or reviewed evidence cannot
  supply a value, withhold it or show an honest unavailable state.
- **Fail closed** on missing, conflicting, cross-filing, wrong-period,
  wrong-company, invalid-unit or unreconciled data.
- Filing identity (accession, form, filed date) does not replace the reporting
  period (`startDate`/`endDate`) or instant (`asOfDate`). Validate them together.
- Keep provenance traceable: taxonomy, CIK, fiscal context, accession, form,
  filed date, SEC URL.
- Formatting, scaling and ratios do not turn a derived value into a reported one.
  Store exact amounts; derive percentages from them.
- `live`, `cached` and `stale` are distinct. Stale data is never shown as live.
- Public market-price display is **not approved**. Keep
  `MARKET_DATA_PUBLIC_DISPLAY_APPROVED` false; normal development needs no
  provider key.
- Beginner-first does not mean truth-reduced: reduce load by sequencing and
  progressive disclosure, not by deleting accounting truth.

## Secrets and privacy

- Never read out, print, commit or copy `.env` values. `SEC_USER_AGENT` must not
  contain a committed private email.
- Do not put private owner context (from `D:\gpt work\Claude-Migration` or the
  master context files) into repository files or outward-facing work.

## Commands

Run from the repo root (`D:\gpt work\finpath`). pnpm is pinned through Corepack;
do not install pnpm globally or run `corepack enable`.

| Task | Command |
|---|---|
| Install web deps | `corepack pnpm install` |
| Install API deps | `.\.venv\Scripts\python.exe -m pip install -e ".\apps\api[dev]"` |
| Web typecheck | `corepack pnpm check:web` (`next typegen && tsc --noEmit`) |
| Web tests | `corepack pnpm test:web` (`node --test tests/*.test.mjs`) |
| Web build | `corepack pnpm build:web` |
| API tests | `.\.venv\Scripts\python.exe -m pytest apps/api/tests --basetemp apps/api/var/pytest` |
| All checks | `powershell -File scripts\check.ps1` |
| Start both servers | `scripts\start-finpath.cmd` (stop: `scripts\stop-finpath.cmd`) |
| API only | `.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8000 --reload` |
| Web only | `corepack pnpm dev:web` (http://127.0.0.1:3000) |

- Keep pytest temp dirs under the ignored `apps/api/var/`.
- Normal API tests use deterministic fixtures and never call SEC or
  Marketstack. Live tests (`-m live`) need `FINPATH_RUN_LIVE_SEC_TEST=1` or
  `FINPATH_RUN_LIVE_MARKET_DATA_TEST=1` and are only run when asked.
- Servers bind to `127.0.0.1` only. Ports 3000 and 8000 must be free; do not
  kill processes you did not start.

## Validation for code changes

In proportion to the change: focused tests, the full relevant suite, typecheck,
production build, `git diff --check`, and real-browser QA. For UI work, check at
1440px and 390px (plus 768 and 320 when layout changes): one H1, no page-level
horizontal overflow, no console errors, keyboard access with visible focus.
Smoke routes: `/`, `/learn`, `/explore`, `/company/aapl` and the affected
`/learn/company-analysis/<lesson-id>` routes. Backend tests are needed only if
the backend changed.

## How to work

- **Independent judgment.** Form a view from evidence. Do not agree by default
  or argue for the sake of it. Change a conclusion on new evidence, not on
  pushback alone.
- **Label certainty** where it matters: confirmed, reported, inferred,
  recommended, hypothetical risk, unknown/unverified, contradicted. Expose
  source conflicts and say which source controls.
- **Verify rather than guess.** Historical test results stay historical unless
  rerun in this task. Never claim QA, tests or deployment that did not happen.
  Passing tests do not prove UX quality.
- **Recommend.** With enough evidence, give 2–3 real options, the trade-offs and
  one recommendation. Major product and design direction is the owner's call.
- **Research first.** Use the repo, docs and benchmarks to narrow a question
  before asking the owner broad questions. Benchmark mature products for
  significant UX work; never copy proprietary code, branding or copy.
- **Discuss before building** significant product, architecture or design
  changes. Design direction is open for review, but redesign freedom never
  permits breaking the contracts above.
- **Continue through approved scope.** Once a direction is approved, carry on
  through routine fixes, tests, QA and self-review without stopping for each
  small step. Stop for a new direction, material scope growth, destructive or
  irreversible actions, or a consequential trade-off.
- **No scope drift.** Approval for one lesson or surface is not approval for
  neighbours. Record unrelated findings separately.
- **User feedback is evidence, not a patch order.** Find the underlying failure
  (wording, comprehension, discoverability, IA or functional) before changing
  things.
- **Tools and skills.** Do not install skills, plugins, dependencies or hooks
  just because they look useful. Inspect source, permissions and license first.
  Report honestly whether something was executed, only inspected or unused.
- **Self-review.** Before reporting, check what you are least sure of, what was
  not verified, and whether you stayed in scope. For code, inspect the final
  diff, unintended files and Git status.
- **Communicate directly.** Conclusion first, reasons, consequences, only
  meaningful caveats. Explain *why*; the owner is also learning Python, APIs,
  Git, testing and architecture, so keep core modules understandable and avoid
  complexity for show.

## Git

- Commit only when asked, on a feature branch, with conventional messages
  (`feat(web): …`, `fix(web): …`, `docs: …`).
- Never push, deploy, merge, rewrite history, or touch `main` without explicit
  approval for that action.
- Never overwrite or revert unrelated user changes.
- Unmerged experimental work is preserved as annotated tags, not branches:
  `archive/visual-system-v2` (also contains Stage 1, Stage 2a and the Stage 3
  reconcept) and `archive/visual-redesign-stage-0`. Do not merge or
  cherry-pick them; port primitives deliberately instead
  (`git show archive/visual-system-v2:<path>`).
- `next dev` may re-add its block in `apps/web/AGENTS.md`; that is expected.
