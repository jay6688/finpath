import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildCapstoneData,
  CapstoneDataError,
} from "../src/lib/capstone-data.ts";
import {
  createDefaultLearningProgress,
  deriveCurrentConcept,
  deriveHomeRecommendation,
  markConceptsExplored,
  normalizeLearningProgress,
} from "../src/lib/learning-progress.ts";
import { getAdjacentLessons, getLesson, lessonCatalog } from "../src/lib/lesson-catalog.ts";
import { makeCapstoneInputs } from "./capstone-fixture.mjs";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("builds one coherent Apple FY2025 Capstone evidence package", () => {
  const result = buildCapstoneData(makeCapstoneInputs());

  assert.deepEqual(result.company, {
    slug: "aapl",
    ticker: "AAPL",
    name: "Apple Inc.",
    cik: "0000320193",
  });
  assert.equal(result.filing.fiscalYear, 2025);
  assert.equal(result.filing.accession, "0000320193-25-000079");
  assert.equal(result.business.kind, "narrative");
  assert.equal(result.performance.revenue.kind, "reported");
  assert.equal(result.performance.revenue.reportedFact.value, 416_161_000_000);
  assert.equal(result.performance.netIncome.kind, "reported");
  assert.equal(result.performance.netIncome.reportedFact.value, 112_010_000_000);
  assert.equal(result.performance.netProfitMargin.kind, "derived");
  assert.equal(result.performance.netProfitMargin.calculation.displayedResult, 26.9);
  assert.equal(result.performance.revenueGrowth?.kind, "derived");
  assert.equal(result.cash.operatingCashFlow.kind, "reported");
  assert.equal(result.cash.operatingCashFlow.reportedFact.value, 111_482_000_000);
  assert.equal(result.cash.freeCashFlow.kind, "derived");
  assert.equal(result.cash.freeCashFlow.calculation.exactResult, 98_767_000_000);
  assert.equal(result.financialPosition.assets.finPathDisplay.value, 359.241);
  assert.equal(result.financialPosition.liabilities.finPathDisplay.value, 285.508);
  assert.equal(result.financialPosition.equity.finPathDisplay.value, 73.733);
  assert.equal(result.financialPosition.cash.finPathDisplay.value, 35.934);
  assert.equal(result.financialPosition.simpleBorrowings.kind, "derived");
  assert.equal(result.financialPosition.simpleBorrowings.calculation.exactResult, 98_657_000_000);
  assert.equal(result.perShare.dilutedEps.kind, "reported");
  assert.equal(result.perShare.dilutedEps.value, "7.46");
  assert.equal(result.perShare.sharesOutstanding.kind, "reported");
  assert.equal(result.perShare.sharesOutstanding.value, 14_776_353_000);
  assert.equal(result.perShare.sharesOutstanding.asOfDate, "2025-10-17");
  assert.equal(result.valuation.kind, "not-assessed");
  assert.match(result.valuation.reason, /verified market-price evidence/i);
  assert.equal(result.connections.length, 2);
});

test("fails closed when any required company, filing, period, or bridge invariant changes", () => {
  const cases = [
    (set) => { set.overview.company.ticker = "MSFT"; },
    (set) => { set.incomeStatement.company.cik = "0000789019"; },
    (set) => { set.incomeStatement.statement.fiscalYear = 2024; },
    (set) => { set.cashFlowStatement.statement.accession = "0000320193-25-000080"; },
    (set) => { set.balanceSheet.statement.sourceUrl = "https://example.com/not-sec"; },
    (set) => { set.cashFlowStatement.statement.startDate = "2024-09-30"; },
    (set) => { set.balanceSheet.statement.asOfDate = "2025-09-26"; },
    (set) => { set.earningsPerShare.statement.accession = "0000320193-25-000080"; },
    (set) => { set.sharesOutstanding.fact.asOfDate = "2025-10-16"; },
    (set) => { set.businessProfile.company.ticker = "MSFT"; },
    (set) => {
      set.cashFlowStatement.statement.sections[0].lines[0].value += 1;
      set.cashFlowStatement.statement.sections[0].lines[3].value -= 1;
    },
    (set) => { set.balanceSheet.statement.cashAndCashEquivalents.value += 1; },
  ];

  for (const mutate of cases) {
    const inputs = structuredClone(makeCapstoneInputs());
    mutate(inputs);
    assert.throws(() => buildCapstoneData(inputs), CapstoneDataError);
  }
});

test("rejects overview Revenue and EPS numerator that do not reconcile to the validated package", () => {
  const wrongRevenue = structuredClone(makeCapstoneInputs());
  wrongRevenue.overview.series.at(-1).value += 1;
  assert.throws(() => buildCapstoneData(wrongRevenue), /Revenue/i);

  const wrongEarnings = structuredClone(makeCapstoneInputs());
  wrongEarnings.earningsPerShare.statement.earningsNumerator.value += 1;
  wrongEarnings.earningsPerShare.statement.basicVerification.numerator += 1;
  wrongEarnings.earningsPerShare.statement.dilutedVerification.numerator += 1;
  assert.throws(() => buildCapstoneData(wrongEarnings), /earnings numerator|Net Income/i);
});

test("Lesson 15 extends version-1 progress without erasing prior lessons", () => {
  assert.equal(getLesson("capstone").number, 15);
  assert.equal(getLesson("capstone").href, "/learn/company-analysis/capstone");
  assert.equal(lessonCatalog.length, 15);
  assert.equal(getAdjacentLessons("business-model").next?.id, "capstone");
  assert.equal(getAdjacentLessons("capstone").previous?.id, "business-model");
  assert.equal(getAdjacentLessons("capstone").next, null);

  const previousProgress = normalizeLearningProgress({
    version: 1,
    exploredConceptIds: lessonCatalog.slice(0, 14).map((lesson) => lesson.id),
  });
  assert.equal(previousProgress.version, 1);
  assert.equal(deriveCurrentConcept(previousProgress), "capstone");
  assert.equal(deriveHomeRecommendation(previousProgress).conceptId, "capstone");

  const completed = markConceptsExplored(previousProgress, ["capstone"]);
  assert.equal(deriveCurrentConcept(completed), null);
  assert.equal(deriveHomeRecommendation(completed).conceptId, "capstone");
  assert.equal(deriveHomeRecommendation(completed).action, "Review");
  assert.deepEqual(
    createDefaultLearningProgress(),
    { version: 1, exploredConceptIds: [] },
  );
});

test("Capstone source keeps synthesis deterministic, Apple-only, and completion explicit", async () => {
  const [page, component, data, navigation, home, path] = await Promise.all([
    readSource("app/learn/company-analysis/capstone/page.tsx"),
    readSource("components/capstone-learning.tsx"),
    readSource("lib/capstone-data.ts"),
    readSource("components/lesson-sequence-navigation.tsx"),
    readSource("components/learning-home.tsx"),
    readSource("components/learning-path-view.tsx"),
  ]);
  const production = `${page}\n${component}\n${data}`;

  assert.match(data, /Promise\.all/);
  assert.match(data, /buildThreeStatementConnectionData/);
  assert.match(data, /deriveNetProfitMargin/);
  assert.match(data, /deriveSimpleFreeCashFlow/);
  assert.match(data, /buildBalanceSheetEvidence/);
  assert.doesNotMatch(data, /getMarketPrice|Marketstack|MARKETSTACK_ACCESS_KEY/);
  assert.match(page, /redirect\("\/learn\/company-analysis\/capstone"\)/);
  assert.doesNotMatch(page, /CompanyExampleSelector/);
  assert.match(component, /The strength of the conclusion should not exceed the strength of the evidence/);
  assert.match(component, /Finish Capstone/);
  assert.match(component, /markExplored\(\["capstone"\]\)/);
  assert.match(production, /Not assessed from verified market evidence/);
  assert.doesNotMatch(component, /type="range"|educational price|stock price input/i);
  assert.match(navigation, /Company Analysis Basics complete/);
  assert.match(navigation, /progress\.exploredConceptIds\.includes\("capstone"\)/);
  assert.match(navigation, /Finish the Capstone to complete this path/);
  assert.match(home, /Company Analysis Basics complete/);
  assert.match(path, /Company Analysis Basics complete/);
  assert.doesNotMatch(production, /current P\/E[^]*\$|current Market Cap[^]*\$/i);
  assert.doesNotMatch(production, /\bLLM\b|generateText|chatCompletion/i);
});

test("Capstone completion requires the final synthesis interaction and has no score or verdict", async () => {
  const component = await readSource("components/capstone-learning.tsx");

  assert.match(component, /allClaimsAnswered/);
  assert.match(component, /disabled=\{!allClaimsAnswered\}/);
  assert.match(component, /This is synthesis practice, not a score/);
  assert.match(component, /Supported by reviewed evidence/);
  assert.match(component, /Needs more evidence/);
  assert.match(component, /Not assessed here/);
  assert.doesNotMatch(component, /\b(?:points|XP|badge|confetti|company rating)\b/i);
  assert.doesNotMatch(component, />\s*(?:Buy|Sell|Hold|Strong company|Weak company|Good investment|Bad investment)\s*</i);
});
