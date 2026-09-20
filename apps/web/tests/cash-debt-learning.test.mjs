import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("Lesson 09 uses URL-backed reviewed company data and progressive learning", async () => {
  const [page, component, catalog, progress, sequence] = await Promise.all([
    readSource("app/learn/company-analysis/cash-and-debt/page.tsx"),
    readSource("components/cash-debt-learning.tsx"),
    readSource("lib/lesson-catalog.ts"),
    readSource("lib/learning-progress.ts"),
    readSource("components/lesson-sequence-navigation.tsx"),
  ]);

  assert.match(page, /conceptId="cash-and-debt"/);
  assert.match(page, /capabilities\.cashDebt/);
  assert.match(page, /searchParams/);
  assert.match(page, /CompanyExampleSelector/);
  assert.match(component, /Can a company have billions in cash and still owe money/);
  assert.match(component, /Cash does not mean no debt/);
  assert.match(component, /Debt is not Total Liabilities/);
  assert.match(component, /FinPath simple borrowings/);
  assert.match(component, /excludes lease obligations/);
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

  assert.match(component, /Company-reported components/);
  assert.match(component, /FinPath-derived total/);
  assert.match(component, /not automatically harmless/);
  assert.match(component, /does not combine these figures into a universal liquidity score or rank companies/);
  assert.match(component, /no supplemental financial-asset line selected/);
  assert.match(balanceLearning, /not a company-reported Total Debt line/);
  assert.match(balanceLearning, /Debt definitions can vary/);
  assert.match(evidence, /"simple-borrowings"/);
  assert.doesNotMatch(component, /Net Debt|current ratio|debt-to-equity|high debt is bad|low debt is good/i);
});

test("Explore adds a restrained company-preserving Cash & Debt path", async () => {
  const snapshot = await readSource("components/financial-position-snapshot.tsx");

  assert.match(snapshot, /Cash and cash equivalents/);
  assert.match(snapshot, /FinPath simple borrowings/);
  assert.match(snapshot, /cash-and-debt\?company=\$\{company\.slug\}/);
  assert.match(snapshot, /Understand Cash & Debt/);
});
