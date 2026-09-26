import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  calculateEducationalPe,
  parseReportedPositiveEps,
} from "../src/lib/pe-ratio-learning.ts";
import {
  createDefaultLearningProgress,
  deriveCurrentConcept,
  deriveHomeRecommendation,
  markConceptsExplored,
} from "../src/lib/learning-progress.ts";
import { getAdjacentLessons, getLesson, lessonCatalog } from "../src/lib/lesson-catalog.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("annual Diluted EPS parser accepts positive two-decimal reported values only", () => {
  assert.deepEqual(parseReportedPositiveEps("7.46"), { normalized: "7.46", cents: 746n });
  assert.deepEqual(parseReportedPositiveEps("17.95"), { normalized: "17.95", cents: 1795n });
  assert.deepEqual(parseReportedPositiveEps("2.73"), { normalized: "2.73", cents: 273n });
  for (const value of ["", "0.00", "-1.00", "5", "5.0", "5.000", "NaN", "Infinity", "1e2"]) {
    assert.throws(() => parseReportedPositiveEps(value));
  }
});

test("educational P/E uses exact BigInt cents and positive half-up rounding", () => {
  const cases = [
    ["100.00", "7.46", "13.40×"],
    ["100.00", "17.95", "5.57×"],
    ["100.00", "2.73", "36.63×"],
    ["100.00", "5.00", "20.00×"],
    ["25.00", "2.00", "12.50×"],
    ["1.00", "8.00", "0.13×"],
  ];
  for (const [price, eps, displayRatio] of cases) {
    assert.equal(calculateEducationalPe(price, eps).displayRatio, displayRatio);
  }
  assert.deepEqual(calculateEducationalPe("100.00", "7.46"), {
    priceCents: 10_000n,
    epsCents: 746n,
    roundedHundredths: 1_340n,
    normalizedPrice: "100.00",
    normalizedEps: "7.46",
    displayRatio: "13.40×",
  });
});

test("Lesson 13 follows Market Cap, preserves progress version 1, and becomes final review", () => {
  const lesson = getLesson("pe-ratio");
  assert.equal(lesson.number, 13);
  assert.equal(lesson.href, "/learn/company-analysis/pe-ratio");
  assert.equal(lessonCatalog.length, 13);
  assert.equal(getAdjacentLessons("market-cap").next?.id, "pe-ratio");
  assert.equal(getAdjacentLessons("pe-ratio").previous?.id, "market-cap");
  assert.equal(getAdjacentLessons("pe-ratio").next, null);

  let progress = createDefaultLearningProgress();
  for (const existing of lessonCatalog.slice(0, 12)) {
    progress = markConceptsExplored(progress, [existing.id]);
  }
  assert.equal(progress.version, 1);
  assert.equal(deriveCurrentConcept(progress), "pe-ratio");
  progress = markConceptsExplored(progress, ["pe-ratio"]);
  assert.equal(deriveCurrentConcept(progress), null);
  assert.equal(deriveHomeRecommendation(progress).conceptId, "pe-ratio");
  assert.equal(deriveHomeRecommendation(progress).action, "Review");
});

test("Lesson 13 source preserves annual Diluted EPS, educational-price, and valuation boundaries", async () => {
  const [page, lesson, evidence, navigation, explore] = await Promise.all([
    readSource("app/learn/company-analysis/pe-ratio/page.tsx"),
    readSource("components/pe-ratio-learning.tsx"),
    readSource("components/eps-evidence-inspector.tsx"),
    readSource("components/lesson-sequence-navigation.tsx"),
    readSource("app/explore/page.tsx"),
  ]);
  const production = `${page}\n${lesson}`;

  assert.match(page, /capabilities\.earningsPerShare/);
  assert.match(page, /getCompanyEarningsPerShare/);
  assert.match(page, /key=/);
  assert.match(lesson, /useState\(""\)/);
  assert.match(lesson, /annual Diluted EPS/i);
  assert.match(lesson, /FinPath simple annual P\/E/i);
  assert.match(lesson, /educational price per share[^]*company-reported Diluted EPS/is);
  assert.match(lesson, /not a current, TTM,[^]*or Forward P\/E/i);
  assert.match(lesson, /does not mean[^]*payback/i);
  assert.match(lesson, /price doubles[^]*P\/E doubles/is);
  assert.match(lesson, /markExplored\(\["pe-ratio"\]\)/);
  assert.match(lesson, /resetDownstream[^]*setVisibleStage\(3\)[^]*setMeaningAnswer\(null\)[^]*setDoubleAnswer\(null\)/);
  assert.match(lesson, /Investor\.gov/);
  assert.match(lesson, /FINRA/);
  assert.match(evidence, /basis === "basic"[^]*statement\.dilutedEps/is);
  assert.match(navigation, /"pe-ratio"/);
  assert.doesNotMatch(production, /Marketstack|MARKETSTACK_ACCESS_KEY|MarketPriceSnapshot|MarketCapSnapshot/);
  assert.doesNotMatch(production, /\/market-data|\/market-price/);
  assert.doesNotMatch(production, /parseFloat|Number\([^)]*\)\s*\//);
  assert.doesNotMatch(production, /buy|sell|undervalued|overvalued|cheap stock|expensive stock/i);
  assert.doesNotMatch(explore, /P\/E[^]*\d|Price.Earnings[^]*\d/i);
});

test("React lesson source contains no hard-coded company EPS fallback", async () => {
  const sources = await Promise.all([
    readSource("components/pe-ratio-learning.tsx"),
    readSource("app/learn/company-analysis/pe-ratio/page.tsx"),
  ]);
  assert.doesNotMatch(sources.join("\n"), /7\.46|17\.95|2\.73/);
});
