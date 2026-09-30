import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("Stage 0 keeps three visual prototypes isolated from production routes", async () => {
  const [home, profit, apple, frame] = await Promise.all([
    readSource("app/prototype/visual-redesign/page.tsx"),
    readSource("app/prototype/visual-redesign/profit/page.tsx"),
    readSource("app/prototype/visual-redesign/apple/page.tsx"),
    readSource("components/visual-prototype/prototype-frame.tsx"),
  ]);

  assert.match(home, /StageZeroHome/);
  assert.match(profit, /StageZeroProfit/);
  assert.match(apple, /StageZeroApple/);
  assert.match(frame, /Stage 0 visual prototype/);
  assert.doesNotMatch(frame, /News|Tutor|Portfolio|Practice/);
  assert.doesNotMatch(frame, /<main/);
});

test("prototype financial surfaces use validated repository data instead of mockup values", async () => {
  const [profitPage, profitComponent, applePage, appleComponent] = await Promise.all([
    readSource("app/prototype/visual-redesign/profit/page.tsx"),
    readSource("components/visual-prototype/stage-zero-profit.tsx"),
    readSource("app/prototype/visual-redesign/apple/page.tsx"),
    readSource("components/visual-prototype/stage-zero-apple.tsx"),
  ]);

  assert.match(profitPage, /getCompanyIncomeStatement/);
  assert.match(profitPage, /validateProfitStatementForLesson/);
  assert.match(profitComponent, /incomeStatementLineMap/);
  assert.match(profitComponent, /statement\.sourceUrl/);
  assert.match(profitComponent, /Other income\/\(expense\), net/);
  assert.match(profitComponent, /Provision for income taxes/);
  assert.doesNotMatch(profitComponent, /Other expense and tax/);

  assert.match(applePage, /getCompanyRevenueData/);
  assert.match(applePage, /validateProfitStatementForLesson/);
  assert.match(applePage, /validateBalanceSheetForLesson/);
  assert.match(applePage, /validateEarningsPerShareForLesson/);
  assert.match(appleComponent, /sourceUrl/);

  for (const source of [profitPage, profitComponent, applePage, appleComponent]) {
    assert.doesNotMatch(source, /TSLA|GOOGL|AMZN|market price|Market Cap/i);
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
