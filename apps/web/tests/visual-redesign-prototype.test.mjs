import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("Stage 0 keeps four visual prototypes isolated from production routes", async () => {
  const [home, profit, apple, marketCap, frame] = await Promise.all([
    readSource("app/prototype/visual-redesign/page.tsx"),
    readSource("app/prototype/visual-redesign/profit/page.tsx"),
    readSource("app/prototype/visual-redesign/apple/page.tsx"),
    readSource("app/prototype/visual-redesign/market-cap/page.tsx"),
    readSource("components/visual-prototype/prototype-frame.tsx"),
  ]);

  assert.match(home, /StageZeroHome/);
  assert.match(profit, /StageZeroProfit/);
  assert.match(apple, /StageZeroApple/);
  assert.match(marketCap, /StageZeroMarketCap/);
  assert.match(frame, /Stage 0 visual prototype/);
  assert.doesNotMatch(frame, /News|Tutor|Portfolio|Practice/);
  assert.doesNotMatch(frame, /<main/);
});

test("Market Cap prototype preserves the reviewed Lesson 12 sandbox boundaries", async () => {
  const [page, component] = await Promise.all([
    readSource("app/prototype/visual-redesign/market-cap/page.tsx"),
    readSource("components/visual-prototype/stage-zero-market-cap.tsx"),
  ]);

  assert.match(page, /getCompanySharesOutstanding/);
  assert.match(page, /validateSharesOutstandingForLesson/);
  assert.match(component, /calculateEducationalMarketCap/);
  assert.match(component, /parseEducationalPrice/);
  assert.match(component, /Learning Sandbox/);
  assert.match(component, /Your imaginary price/);
  assert.match(component, /This is not Apple market data/);
  assert.match(component, /type="number"/);
  assert.match(component, /reported SEC shares/i);
  assert.match(component, /FinPath-derived educational Market Cap/);
  assert.doesNotMatch(component, /Marketstack|current Market Cap|P\/E Ratio/i);
});

test("prototype financial surfaces use validated repository data instead of mockup values", async () => {
  const [profitPage, profitComponent, profitContent, applePage, appleComponent] = await Promise.all([
    readSource("app/prototype/visual-redesign/profit/page.tsx"),
    readSource("components/visual-prototype/stage-zero-profit.tsx"),
    readSource("content/profit-lessons/aapl-profit-fy2025.json"),
    readSource("app/prototype/visual-redesign/apple/page.tsx"),
    readSource("components/visual-prototype/stage-zero-apple.tsx"),
  ]);

  assert.match(profitPage, /getCompanyIncomeStatement/);
  assert.match(profitPage, /validateProfitStatementForLesson/);
  assert.match(profitComponent, /incomeStatementLineMap/);
  assert.match(profitComponent, /statement\.sourceUrl/);
  assert.match(profitContent, /Other income\/\(expense\), net/);
  assert.match(profitContent, /Provision for income taxes/);
  assert.doesNotMatch(profitComponent, /Other expense and tax/);

  assert.match(applePage, /getCompanyRevenueData/);
  assert.match(applePage, /validateProfitStatementForLesson/);
  assert.match(applePage, /validateBalanceSheetForLesson/);
  assert.match(applePage, /validateEarningsPerShareForLesson/);
  assert.match(appleComponent, /sourceUrl/);

  for (const source of [profitPage, profitComponent, applePage, appleComponent]) {
    assert.doesNotMatch(source, /TSLA|GOOGL|AMZN/);
  }
});

test("prototype Home reuses the canonical lesson path and live local progress", async () => {
  const home = await readSource("components/visual-prototype/stage-zero-home.tsx");

  assert.match(home, /lessonCatalog/);
  assert.match(home, /useLearningProgress/);
  assert.match(home, /deriveHomeRecommendation/);
  assert.doesNotMatch(home, /11 of 15|73%/);
});

test("prototype styling provides distinct Learn and Explore density with mobile rules", async () => {
  const styles = await readSource(
    "components/visual-prototype/visual-prototype.module.css",
  );

  assert.match(styles, /\.learnCanvas/);
  assert.match(styles, /\.exploreCanvas/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(max-width: 380px\)/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("Stage 0.5 Home renders a concept map rather than a lesson checklist", async () => {
  const home = await readSource("components/visual-prototype/stage-zero-home.tsx");

  assert.match(home, /Concept connections, not lesson order/);
  assert.match(home, /className=\{styles\.conceptMap\}/);
  assert.match(home, /<svg/);
  assert.match(home, /data-map-node/);
  assert.match(home, /Revenue/);
  assert.match(home, /Cash Flow/);
  assert.match(home, /Position/);
  assert.match(home, /Per Share/);
  assert.match(home, /Valuation/);
});

test("Stage 0.5 Profit visual preserves all nine reported lines with data-aware geometry", async () => {
  const profit = await readSource(
    "components/visual-prototype/stage-zero-profit.tsx",
  );

  for (const lineId of [
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
    assert.match(profit, new RegExp(`id: "${lineId}"`));
  }

  assert.match(profit, /--magnitude/);
  assert.match(profit, /--offset/);
  assert.match(profit, /--connector/);
  assert.match(profit, /styles\.profitWaterfall/);
  assert.doesNotMatch(profit, /Reveal next/);
});

test("Stage 0.5 Explore uses reviewed Revenue series and an honest valuation boundary", async () => {
  const apple = await readSource(
    "components/visual-prototype/stage-zero-apple.tsx",
  );

  assert.match(apple, /className=\{styles\.revenueCurve\}/);
  assert.match(apple, /<svg/);
  assert.match(apple, /series\.map/);
  assert.match(apple, /Valuation/);
  assert.match(apple, /Not assessed/);
  assert.match(apple, /No verified market price/);
  assert.doesNotMatch(apple, /Marketstack|current share price/i);
});

test("Stage 0.5 Sandbox expresses one continuous equation without changing its inputs", async () => {
  const sandbox = await readSource(
    "components/visual-prototype/stage-zero-market-cap.tsx",
  );

  assert.match(sandbox, /data-complete=\{Boolean\(calculation\)\}/);
  assert.match(sandbox, /className=\{styles\.sandboxIdentity\}/);
  assert.match(sandbox, /<svg/);
  assert.match(sandbox, /type="number"/);
  assert.match(sandbox, /calculateEducationalMarketCap/);
  assert.match(sandbox, /This is not Apple market data/);
});
