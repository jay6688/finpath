import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("the Profit route keeps its identity and uses the production Ledger body", async () => {
  const [page, journey] = await Promise.all([
    readSource("app/learn/company-analysis/profit/page.tsx"),
    readSource("components/profit-learning-journey.tsx"),
  ]);

  assert.match(page, /<LessonShell conceptId="profit"/);
  assert.match(page, /<ProfitLearningJourney incomeStatement=\{incomeStatement\}/);
  assert.match(page, /will not replace missing or mismatched SEC facts with hard-coded values/i);
  assert.match(journey, /buildProfitLedgerPresentation/);
  assert.match(journey, /<QuantitativeLedger/);
  assert.doesNotMatch(`${page}\n${journey}`, /MetricDossier|NumberPassport/);
});

test("the Ledger renders one exact 100 percent composition without a cosmetic minimum", async () => {
  const [ledger, styles] = await Promise.all([
    readSource("components/quantitative-ledger.tsx"),
    readSource("components/quantitative-ledger.module.css"),
  ]);

  assert.match(ledger, /model\.composition\.map/);
  assert.match(ledger, /presentationShareOfRevenue/);
  assert.match(ledger, /locatorPositionPercentOfRevenue/);
  assert.match(ledger, /<SignedAdjustmentMarker/);
  assert.match(ledger, /scaleNote/);
  assert.match(
    ledger,
    /signed-adjustment"[^]*formatAdjustment\(transformation\)/,
  );
  assert.match(ledger, /Before/);
  assert.match(ledger, /Adjustment/);
  assert.match(ledger, /After/);
  assert.match(ledger, /aria-live="polite"/);
  assert.match(ledger, /aria-pressed/);
  assert.doesNotMatch(`${ledger}\n${styles}`, /Math\.max|Math\.min|min(?:imum)?Percent/i);
  assert.match(styles, /width:\s*calc\(var\(--ledger-share\) \* 1%\)/);
  assert.match(styles, /min-(?:block-)?size:\s*var\(--fp-v2-touch\)/);
  assert.match(styles, /\.markerRule[^}]*width:\s*1px/s);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("selection changes explanation but not geometry or learning progress", async () => {
  const [journey, ledger] = await Promise.all([
    readSource("components/profit-learning-journey.tsx"),
    readSource("components/quantitative-ledger.tsx"),
  ]);

  assert.match(
    journey,
    /useState<ProfitLedgerTransformation\["id"\]>\([^]*"total-cost-of-sales"/,
  );
  assert.match(journey, /function selectLine/);
  assert.match(journey, /function completeLesson/);

  const selectLine = journey.slice(
    journey.indexOf("function selectLine"),
    journey.indexOf("function completeLesson"),
  );
  const completeLesson = journey.slice(
    journey.indexOf("function completeLesson"),
    journey.indexOf("function reviewUnderstanding"),
  );
  assert.doesNotMatch(selectLine, /markExplored/);
  assert.match(completeLesson, /markExplored\(\["profit"\]\)/);
  assert.doesNotMatch(ledger, /selectedId[^]*presentationShareOfRevenue\s*=/);
});

test("the migrated body preserves evidence, exact records, and source access", async () => {
  const [journey, content] = await Promise.all([
    readSource("components/profit-learning-journey.tsx"),
    readSource("content/profit-lessons/aapl-profit-fy2025.json").then(JSON.parse),
  ]);

  assert.equal(content.ledger.defaultSelection, "total-cost-of-sales");
  assert.deepEqual(Object.keys(content.ledger.transformations), [
    "total-cost-of-sales",
    "total-operating-expenses",
    "other-income-expense-net",
    "income-tax-provision",
  ]);
  assert.equal("stages" in content, false);
  assert.match(content.boundary, /does not show when cash moved/i);
  assert.match(journey, /<EvidenceInspector/);
  assert.match(journey, /Check my reasoning/);
  assert.match(journey, /Verify Apple.+exact record and SEC provenance/s);
  assert.match(journey, /href=\{statement\.sourceUrl\}/);
  assert.match(journey, /Open official SEC filing index/);
  assert.match(journey, /dataStatus\.state === "stale"/);
});

test("Net Income remains a result and is not offered as an adjustment control", async () => {
  const ledger = await readSource("components/quantitative-ledger.tsx");

  assert.match(ledger, /model\.result/);
  assert.match(ledger, /Result \/ remainder/);
  assert.match(ledger, /model\.transformations\.map/);
  assert.doesNotMatch(ledger, /onSelect\("net-income"\)/);
});
