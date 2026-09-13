# Learning Flow and Information Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Home, Learn, and Explore distinct responsibilities while moving all five implemented lessons to canonical Learn routes without changing financial truth or resetting existing progress.

**Architecture:** Keep the FastAPI and SEC contracts unchanged. Extract the existing Apple Revenue loading and evidence assembly into one server-side web helper consumed by both Learn and Explore, wrap lesson bodies in one semantic Learn shell, and use redirects for the three former `/company/aapl/*` lesson pages. Preserve the version-1 progress payload and existing concept IDs while making Revenue and Revenue Growth independent first-class steps.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 7, native HTML/CSS, existing FastAPI API and Node test runner.

---

### Task 1: Lock the target information architecture in tests

**Files:**
- Create: `apps/web/tests/information-architecture.test.mjs`
- Modify: `apps/web/tests/learning-path.test.mjs`
- Modify: `apps/web/tests/product-shell.test.mjs`

- [ ] Add assertions for the five canonical Learn URLs, independent Revenue and Revenue Growth states, semantic Learn/Explore navigation, lesson breadcrumbs, cross-links, redirects, and unchanged Evidence Inspector usage.
- [ ] Run `corepack pnpm test:web` and confirm failures point to the current `/company/*` lesson links, grouped Revenue state, missing canonical pages, and missing redirects.

### Task 2: Centralize lesson sequence and preserve version-1 progress

**Files:**
- Create: `apps/web/src/lib/lesson-catalog.ts`
- Modify: `apps/web/src/lib/learning-progress.ts`
- Modify: `apps/web/src/components/learning-home.tsx`
- Modify: `apps/web/src/components/learning-path-view.tsx`

- [ ] Define the ordered lesson catalog with IDs, numbering, titles, goals, and canonical URLs:

```text
Revenue -> Revenue Growth -> Profit / Net Income -> Net Profit Margin -> Operating Cash Flow
```

- [ ] Keep `LEARNING_PROGRESS_VERSION = 1` and the five existing concept IDs. Normalize them independently so previously stored arrays remain intact.
- [ ] Make Home recommend the first unexplored concept using its canonical Learn URL and show only one recommendation, an explored-count context, and one separate Explore entry.
- [ ] Render all five concepts as equal first-class entries on `/learn` and keep `More concepts coming` outside the numbered course list.
- [ ] Run the focused learning-path tests and confirm they pass.

### Task 3: Add the shared lesson shell and sequence navigation

**Files:**
- Create: `apps/web/src/components/lesson-shell.tsx`
- Create: `apps/web/src/components/lesson-sequence-navigation.tsx`
- Modify: `apps/web/src/components/profit-learning-journey.tsx`
- Modify: `apps/web/src/components/profit-margin-learning.tsx`
- Modify: `apps/web/src/components/operating-cash-flow-learning.tsx`
- Delete: `apps/web/src/components/learning-up-next.tsx`

- [ ] Render `Home / Learn / Company Analysis Basics / <lesson>` breadcrumbs, `Lesson N of 5`, the lesson title, and Apple as the real example rather than the product-space identity.
- [ ] Render explicit previous and next lesson links from the catalog plus an `Explore Apple` cross-link. OCF ends with `More concepts coming` and no sixth lesson.
- [ ] Preserve all existing lesson bodies and their completion logic; only Revenue marks itself explored when its explicit next-lesson action is used.
- [ ] Remove the former Up Next component so it cannot route a Learn user into `/company/*`.

### Task 4: Share Revenue data and separate Revenue learning from Apple research

**Files:**
- Create: `apps/web/src/lib/apple-revenue-data.ts`
- Create: `apps/web/src/components/revenue-exact-records.tsx`
- Create: `apps/web/src/components/revenue-lesson-content.tsx`
- Modify: `apps/web/src/components/revenue-history.tsx`
- Modify: `apps/web/src/components/revenue-growth-explorer.tsx`
- Modify: `apps/web/src/app/company/aapl/page.tsx`

- [ ] Move the existing overview, income-statement validation, reviewed presentation, and Revenue evidence assembly into one shared server helper. Preserve graceful degradation exactly.
- [ ] Extract the existing desktop table and mobile exact records into a reusable research component.
- [ ] Keep Revenue definition, why it matters, limitation, Revenue-versus-Profit, Chinese explanation, teaching sources, reported evidence, and live Apple value in the Revenue lesson.
- [ ] Keep year-over-year interaction, reviewed context, derived evidence, and exact history in Revenue Growth; mark only `revenue-growth` when that lesson is used.
- [ ] Make `/company/aapl` an Explore research page containing the live Revenue snapshot, provenance, exact history, and honest links to Learn Revenue and Revenue Growth. Keep an `id="revenue-growth"` compatibility anchor for old fragment bookmarks.

### Task 5: Create canonical pages and legacy redirects

**Files:**
- Create: `apps/web/src/app/learn/company-analysis/revenue/page.tsx`
- Create: `apps/web/src/app/learn/company-analysis/revenue-growth/page.tsx`
- Create: `apps/web/src/app/learn/company-analysis/profit/page.tsx`
- Create: `apps/web/src/app/learn/company-analysis/net-profit-margin/page.tsx`
- Create: `apps/web/src/app/learn/company-analysis/operating-cash-flow/page.tsx`
- Replace: `apps/web/src/app/company/aapl/profit/page.tsx`
- Replace: `apps/web/src/app/company/aapl/profit-margin/page.tsx`
- Replace: `apps/web/src/app/company/aapl/operating-cash-flow/page.tsx`

- [ ] Move the current validated data fetching into the canonical Learn pages and wrap each unchanged lesson body in `LessonShell`.
- [ ] Give lesson pages learning-focused metadata.
- [ ] Use Next.js permanent redirects from all three former company lesson URLs.
- [ ] Update every internal recommendation and sequence link to canonical Learn URLs. Do not try to server-redirect a URL fragment; retain the Apple page anchor and explain the limitation in the final report.

### Task 6: Add minimal IA styling and run full verification

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] Add only styles needed for the lesson identity header, sequence navigation, reduced Home hierarchy, five-item Learn list, and Learn/Explore cross-links. Reuse existing color, typography, spacing, focus, and responsive tokens.
- [ ] Run `corepack pnpm test:web`.
- [ ] Run `.\.venv\Scripts\python.exe -m pytest apps/api/tests --basetemp apps/api/var/pytest-ia-final`.
- [ ] Run `corepack pnpm check:web` and `corepack pnpm build:web`.
- [ ] Confirm the build contains all five canonical Learn routes and all three legacy redirect routes.

### Task 7: Browser, adversarial, Git, and deployment verification

**Legacy fragment limitation:** URL fragments are not sent to the Next.js
server. Existing internal links now use the canonical Revenue Growth lesson
route, but an old bookmark to `/company/aapl#revenue-growth` can only open the
valid Apple Explore page; it cannot be server-redirected to Learn without
client-side interception or duplicate content.

**Files:**
- Modify only confirmed in-scope defects discovered by QA.

- [ ] At 1440, 390, and 320 widths, execute the new-learner path, existing-progress continuation, Explore path, both cross-link directions, and all three legacy redirects.
- [ ] Confirm Learn is active on every canonical lesson, Explore is active only on `/company/aapl`, breadcrumbs agree, no horizontal overflow appears, interactive controls remain keyboard accessible, and the console has no errors.
- [ ] Inspect the final diff for duplicated financial truth, changed provenance, hard-coded financial values, accidental curriculum additions, secrets, generated files, and unrelated edits.
- [ ] Re-run the complete verification commands immediately before committing.
- [ ] Commit one scoped IA refactor, push `main`, confirm both Vercel projects deploy that exact SHA, and verify the canonical deployed routes.
