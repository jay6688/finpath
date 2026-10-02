import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("Stage 3 remains isolated from production navigation and production routes", async () => {
  const [navigation, home, profit, apple] = await Promise.all([
    readSource("components/app-navigation.tsx"),
    readSource("app/design-lab/reconcept/page.tsx"),
    readSource("app/design-lab/reconcept/profit/page.tsx"),
    readSource("app/design-lab/reconcept/apple/page.tsx"),
  ]);

  assert.doesNotMatch(navigation, /design-lab\/reconcept/);
  assert.match(home, /ReconceptHome/);
  assert.match(profit, /ReconceptProfit/);
  assert.match(apple, /ReconceptApple/);
});

test("the re-concept Home uses real progress and a relationship map, not lesson order", async () => {
  const source = await readSource("components/reconcept/reconcept-home.tsx");

  assert.match(source, /useLearningProgress/);
  assert.match(source, /deriveHomeRecommendation/);
  assert.match(source, /Concept relationships, not lesson order/);
  assert.match(source, /Business/);
  assert.match(source, /Revenue/);
  assert.match(source, /Profit/);
  assert.match(source, /Cash Flow/);
  assert.match(source, /Financial Position/);
  assert.match(source, /Per Share/);
  assert.match(source, /Valuation/);
  assert.doesNotMatch(source, /fake|mock progress/i);
});

test("Profit reads validated reviewed data and keeps every accounting line distinct", async () => {
  const [page, component] = await Promise.all([
    readSource("app/design-lab/reconcept/profit/page.tsx"),
    readSource("components/reconcept/reconcept-profit.tsx"),
  ]);

  assert.match(page, /getCompanyIncomeStatement/);
  assert.match(page, /validateProfitStatementForLesson/);
  for (const id of [
    "total-net-sales",
    "total-cost-of-sales",
    "gross-margin",
    "total-operating-expenses",
    "operating-income",
    "other-income-expense-net",
    "income-before-income-taxes",
    "income-tax-provision",
    "net-income",
  ]) {
    assert.match(component, new RegExp(id));
  }
  assert.match(component, /not cash/i);
  assert.match(component, /statement\.sourceUrl/);
  assert.doesNotMatch(component, /416_161_000_000|112_010_000_000/);
});

test("Apple research uses reviewed APIs and refuses unsupported market values", async () => {
  const [page, component] = await Promise.all([
    readSource("app/design-lab/reconcept/apple/page.tsx"),
    readSource("components/reconcept/reconcept-apple.tsx"),
  ]);

  assert.match(page, /getSupportedCompanies/);
  assert.match(page, /getCompanyRevenueData/);
  assert.match(page, /getCompanyIncomeStatement/);
  assert.match(page, /getCompanyBalanceSheet/);
  assert.match(page, /getCompanyEarningsPerShare/);
  assert.match(component, /Not assessed/);
  assert.match(component, /No verified market price/);
  assert.match(component, /does not show a current Market Cap or P\/E/);
  assert.match(component, /sourceUrl/);
  assert.doesNotMatch(component, /\$\d+(?:\.\d+)?\s*(?:Market Cap|share price)|P\/E\s*\d/i);
  assert.doesNotMatch(component, /416_161_000_000|112_010_000_000/);
});

test("Stage 3 uses scoped CSS and no external visual dependency", async () => {
  const [styles, packageJson] = await Promise.all([
    readSource("components/reconcept/reconcept.module.css"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(packageJson, /framer-motion|recharts|visx|gsap|tailwind/);
});
