import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildCapstoneData,
  CapstoneDataError,
} from "../src/lib/capstone-data.ts";
import {
  buildCapstoneDraftKey,
  buildLearnerAnalysisNote,
  clearCapstoneDraft,
  createEmptyCapstoneDraft,
  deriveScenarioValuation,
  readCapstoneDraft,
  validateCapstoneCompletion,
  writeCapstoneDraft,
} from "../src/lib/capstone-draft.ts";
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

class MemoryStorage {
  values = new Map();

  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

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
  assert.deepEqual(
    result.connections.map((connection) => connection.type),
    [
      "conceptual-only",
      "arithmetic",
      "reconciliation",
      "arithmetic",
      "period-flow-to-ending-balance",
    ],
  );
  assert.deepEqual(
    result.casebook.map((question) => question.id),
    [
      "revenue-origin",
      "period-performance",
      "profit-to-cash",
      "financial-position",
      "per-share-valuation",
    ],
  );
  assert.ok(result.casebook.every((question) => question.evidence.length > 0));
  assert.ok(result.casebook.every((question) => question.unknowns.length > 0));
  assert.ok(
    result.casebook
      .flatMap((question) => question.evidence)
      .every((item) => ["reported", "reviewed", "finpath-derived"].includes(item.provenance)),
  );
  assert.ok(
    result.casebook
      .flatMap((question) => question.unknowns)
      .every((item) => item.provenance === "unknown"),
  );
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(result.cash.activityEvidence).map(([id, item]) => [id, item.kind]),
    ),
    {
      operating: "reported",
      investing: "reported",
      financing: "reported",
      reportedChange: "reported",
      beginningBalance: "reported",
      endingBalance: "reported",
    },
  );
});

test("one learner price drives both scenario Market Cap and annual P/E without market-data claims", () => {
  const scenario = deriveScenarioValuation({
    price: 200,
    sharesOutstanding: 14_776_353_000,
    dilutedEps: "7.46",
  });

  assert.equal(scenario.provenance, "learner-scenario");
  assert.equal(scenario.price, 200);
  assert.equal(scenario.marketCap, 2_955_270_600_000);
  assert.equal(scenario.annualPE, 200 / 7.46);
  assert.equal(scenario.marketCapPrice, scenario.pePrice);
  assert.match(scenario.boundary, /not current market data/i);
  assert.throws(
    () => deriveScenarioValuation({ price: -1, sharesOutstanding: 1, dilutedEps: "1" }),
    /positive educational price/i,
  );
});

test("versioned Capstone drafts restore safely, fail softly when corrupt, and clear independently", () => {
  const key = buildCapstoneDraftKey({
    company: "aapl",
    accession: "0000320193-25-000079",
  });
  assert.equal(key, "finpath.capstone-draft:v1:aapl:0000320193-25-000079");

  const storage = new MemoryStorage();
  const draft = createEmptyCapstoneDraft({
    company: "aapl",
    accession: "0000320193-25-000079",
  });
  draft.selectedEvidenceIds = ["performance-revenue"];
  assert.equal(writeCapstoneDraft(storage, key, draft), true);
  assert.deepEqual(readCapstoneDraft(storage, key), {
    status: "restored",
    draft,
    persistence: "local-browser",
  });

  storage.setItem(key, "{not-json");
  const corrupt = readCapstoneDraft(storage, key);
  assert.equal(corrupt.status, "corrupt");
  assert.equal(corrupt.persistence, "session-only");
  assert.deepEqual(corrupt.draft.selectedEvidenceIds, []);

  storage.setItem("finpath.learning-progress", "preserve-me");
  storage.setItem(key, JSON.stringify(draft));
  assert.equal(clearCapstoneDraft(storage, key), true);
  assert.equal(storage.getItem(key), null);
  assert.equal(storage.getItem("finpath.learning-progress"), "preserve-me");
});

test("completion requires two evidence-linked judgments, an uncertainty, valuation resolution, and note review", () => {
  const data = buildCapstoneData(makeCapstoneInputs());
  const draft = createEmptyCapstoneDraft({
    company: "aapl",
    accession: data.filing.accession,
  });
  draft.selectedEvidenceIds = ["performance-revenue", "cash-operating"];
  draft.judgments = [
    {
      id: "judgment-1",
      questionId: "period-performance",
      stance: "strong",
      interpretation: "Revenue increased on the reviewed comparison.",
      basis: "Prior-year Revenue comparison.",
      evidenceIds: ["performance-revenue"],
    },
    {
      id: "judgment-2",
      questionId: "profit-to-cash",
      stance: "uncertain",
      interpretation: "One annual cash result does not establish sustainability.",
      basis: "",
      evidenceIds: ["cash-operating"],
    },
  ];
  draft.uncertainty = "Future cash-generation durability is not supported.";
  draft.valuation = { state: "unassessed", priceInput: "" };
  draft.noteReviewed = true;

  assert.deepEqual(validateCapstoneCompletion(draft), { complete: true, missing: [] });
  const note = buildLearnerAnalysisNote(draft, data.evidenceCatalog);
  assert.equal(note.strong.length, 1);
  assert.equal(note.weak.length, 0);
  assert.equal(note.uncertain.length, 1);
  assert.equal(note.weakState, "No supported weakness identified from this evidence package.");
  assert.equal(note.strong[0].citation.recordType, "Judgment Citation");
  assert.equal(note.strong[0].citation.provenance, "learner-judgment");
  assert.match(note.strong[0].citation.evidence[0].label, /Revenue/);
  assert.doesNotMatch(JSON.stringify(note), /\b(?:BUY|SELL|HOLD|fair value|price target)\b/i);

  draft.judgments[0].basis = "";
  assert.equal(validateCapstoneCompletion(draft).complete, false);
  draft.judgments[0].stance = "uncertain";
  assert.equal(validateCapstoneCompletion(draft).complete, true);
  draft.valuation = { state: "unresolved", priceInput: "" };
  assert.equal(validateCapstoneCompletion(draft).complete, false);
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

test("Capstone source keeps evidence explicit, Apple-only, locally drafted, and completion explicit", async () => {
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
  assert.match(data, /casebook/);
  assert.match(data, /activityEvidence/);
  assert.doesNotMatch(data, /getMarketPrice|Marketstack|MARKETSTACK_ACCESS_KEY/);
  assert.match(page, /redirect\("\/learn\/company-analysis\/capstone"\)/);
  assert.doesNotMatch(page, /CompanyExampleSelector/);
  assert.match(component, /Evidence Casebook/);
  assert.match(component, /Your judgment · not a reported fact or FinPath recommendation/);
  assert.match(component, /Analysis Note/);
  assert.match(component, /Submit Analysis Note/);
  assert.match(component, /markExplored\(\["capstone"\]\)/);
  assert.match(production, /Not assessed from verified market evidence/);
  assert.match(component, /educational price/i);
  assert.match(component, /not current market data/i);
  assert.match(component, /clearCapstoneDraft/);
  assert.doesNotMatch(component, /type="range"/);
  assert.match(navigation, /Company Analysis Basics complete/);
  assert.match(navigation, /progress\.exploredConceptIds\.includes\("capstone"\)/);
  assert.match(navigation, /Finish the Capstone to complete this path/);
  assert.match(home, /Learning path complete/);
  assert.match(path, /Company Analysis Basics complete/);
  assert.doesNotMatch(production, /current P\/E[^]*\$|current Market Cap[^]*\$/i);
  assert.doesNotMatch(production, /\bLLM\b|generateText|chatCompletion/i);
});

test("Capstone completion is learner-owned and has no score, forced weakness, or verdict", async () => {
  const [component, styles] = await Promise.all([
    readSource("components/capstone-learning.tsx"),
    readSource("components/capstone-learning.module.css"),
  ]);

  assert.match(component, /validateCapstoneCompletion/);
  assert.match(component, /disabled=\{!completion\.complete/);
  assert.match(component, /This is synthesis practice, not a score/i);
  assert.match(component, /No supported weakness identified from this evidence package/);
  assert.match(component, /strong/);
  assert.match(component, /weak/);
  assert.match(component, /uncertain/);
  assert.doesNotMatch(component, /onChange=\{[^}]*markExplored/);
  assert.doesNotMatch(component, /\b(?:points|XP|badge|confetti|company rating)\b/i);
  assert.doesNotMatch(component, />\s*(?:Buy|Sell|Hold|Strong company|Weak company|Good investment|Bad investment)\s*</i);
  assert.match(
    styles,
    /\.submitButton:disabled\s*\{[^}]*background:[^;]+;[^}]*color:[^;]+;/s,
  );
});
