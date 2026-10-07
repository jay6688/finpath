import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("Lesson 09 uses a reviewed common-scale balance comparison", async () => {
  const [page, component, styles, catalog, progress, sequence] = await Promise.all([
    readSource("app/learn/company-analysis/cash-and-debt/page.tsx"),
    readSource("components/cash-debt-learning.tsx"),
    readSource("components/cash-debt-learning.module.css"),
    readSource("lib/lesson-catalog.ts"),
    readSource("lib/learning-progress.ts"),
    readSource("components/lesson-sequence-navigation.tsx"),
  ]);

  assert.match(page, /conceptId="cash-and-debt"/);
  assert.match(page, /capabilities\.cashDebt/);
  assert.match(page, /searchParams/);
  assert.match(page, /CompanyExampleSelector/);
  assert.match(page, /buildCashDebtPresentation/);
  assert.match(page, /presentation=\{presentation\}/);
  assert.match(component, /How can a company have cash and debt at the same time/);
  assert.match(component, /Cash and cash equivalents/);
  assert.match(component, /Borrowings are not Total Liabilities/);
  assert.match(component, /FinPath simple borrowings/);
  assert.match(component, /excludes lease obligations/);
  assert.match(component, /--position-magnitude/);
  assert.match(styles, /width:\s*calc\(var\(--position-magnitude\) \* 1%\)/);
  assert.doesNotMatch(styles, /min-inline-size|width:\s*(?:min|max|clamp)\(/);
  assert.doesNotMatch(component, /visibleStage|cash-continue/);
  assert.match(component, /markExplored\(\["cash-and-debt"\]\)/);
  assert.match(component, /EvidenceInspector/);
  assert.match(catalog, /number: 9/);
  assert.match(progress, /cash-and-debt/);
  assert.match(sequence, /"balance-sheet",\s*\n\s*"cash-and-debt"/);
  assert.doesNotMatch(`${page}${component}`, /35934000000|98657000000|40294000000|44762000000/);
});

test("Lesson 09 keeps reported, derived and no-judgement boundaries explicit", async () => {
  const [component, balanceLearning, evidence] = await Promise.all([
    readSource("components/cash-debt-learning.tsx"),
    readSource("lib/balance-sheet-learning.ts"),
    readSource("lib/evidence.ts"),
  ]);

  assert.match(component, /Company-reported borrowing components/);
  assert.match(component, /FinPath-derived balance-sheet position/);
  assert.match(component, /Debt is not automatically distress/);
  assert.match(component, /Cash does not automatically imply strength/);
  assert.match(component, /does not provide an investment verdict/);
  assert.match(component, /no supplemental financial-asset line selected/);
  assert.match(balanceLearning, /not a company-reported Total Debt line/);
  assert.match(balanceLearning, /Debt definitions can vary/);
  assert.match(evidence, /"simple-borrowings"/);
  assert.doesNotMatch(component, /Net Debt|current ratio|debt-to-equity|high debt is bad|low debt is good/i);
});

test("Cash & Debt inspection cannot write progress and completion stays submission-only", async () => {
  const component = await readSource("components/cash-debt-learning.tsx");

  assert.match(component, /function review[\s\S]*markExplored\(\["cash-and-debt"\]\)/);
  assert.match(component, /onClick=\{\(\) => setSelectedPosition/);
  assert.doesNotMatch(component, /onClick=\{\(\) =>[^}]*markExplored/);
  assert.match(component, /name="cash-debt-coexistence"/);
  assert.match(component, /EvidenceInspector/);
});

test("Explore adds a restrained company-preserving Cash & Debt path", async () => {
  const snapshot = await readSource("components/financial-position-snapshot.tsx");

  assert.match(snapshot, /Cash and cash equivalents/);
  assert.match(snapshot, /FinPath simple borrowings/);
  assert.match(snapshot, /cash-and-debt\?company=\$\{company\.slug\}/);
  assert.match(snapshot, /Understand Cash & Debt/);
});
