import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildCashActivityPresentation,
  CashFlowLearningDataError,
  deriveSimpleFreeCashFlow,
  validateCompleteCashFlowStatement,
} from "../src/lib/cash-flow-learning.ts";
import { buildFreeCashFlowEvidence } from "../src/lib/evidence.ts";
import { makeCashFlowStatement, makeCompanyCashFlowStatement } from "./cash-flow-fixture.mjs";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("validates one complete FY2025 statement and derives simple FCF exactly", () => {
  const statement = makeCashFlowStatement();

  assert.doesNotThrow(() =>
    validateCompleteCashFlowStatement(statement, {
      fiscalYear: 2025,
      accession: "0000320193-25-000079",
    }),
  );
  assert.deepEqual(deriveSimpleFreeCashFlow(statement), {
    operatingCashFlow: 111_482_000_000,
    propertyPlantEquipmentPurchases: 12_715_000_000,
    exactValue: 98_767_000_000,
    displayBillions: 98.767,
  });
});

test("builds the reviewed FY2025 Cash Activity presentation without rounding geometry", () => {
  const statement = makeCashFlowStatement();
  const presentation = buildCashActivityPresentation(statement, {
    fiscalYear: 2025,
    accession: "0000320193-25-000079",
  });

  assert.equal(presentation.activityScale.referenceAmount, 120_686_000_000);
  assert.equal(presentation.childScale.referenceAmount, 90_711_000_000);
  assert.deepEqual(
    presentation.activities.map((activity) => [
      activity.id,
      activity.amount,
      activity.direction,
      activity.kind,
    ]),
    [
      ["operating", 111_482_000_000, "inflow", "reported-section-total"],
      ["investing", 15_195_000_000, "inflow", "reported-section-total"],
      ["financing", -120_686_000_000, "outflow", "reported-section-total"],
    ],
  );
  assert.equal(
    presentation.activities[0].magnitudePercent,
    (111_482_000_000 / 120_686_000_000) * 100,
  );
  assert.equal(
    presentation.activities[1].magnitudePercent,
    (15_195_000_000 / 120_686_000_000) * 100,
  );
  assert.equal(presentation.activities[2].magnitudePercent, 100);
  assert.deepEqual(presentation.change, {
    id: "net-change-in-cash",
    amount: 5_991_000_000,
    direction: "inflow",
    kind: "reported-cash-change",
    magnitudePercent: (5_991_000_000 / 120_686_000_000) * 100,
  });
  assert.deepEqual(presentation.balance, {
    beginning: 29_943_000_000,
    change: 5_991_000_000,
    ending: 35_934_000_000,
  });

  const investing = presentation.activities[1];
  const financing = presentation.activities[2];
  assert.deepEqual(
    investing.lines.map((line) => [line.id, line.amount, line.role, line.direction]),
    [
      ["purchases-of-marketable-securities", -24_407_000_000, "cash-outflow", "outflow"],
      ["maturities-of-marketable-securities", 40_907_000_000, "cash-inflow", "inflow"],
      ["sales-of-marketable-securities", 12_890_000_000, "cash-inflow", "inflow"],
      ["payments-for-property-plant-and-equipment", -12_715_000_000, "cash-outflow", "outflow"],
      ["other-investing-activities", -1_480_000_000, "cash-outflow", "outflow"],
    ],
  );
  assert.deepEqual(
    financing.lines.map((line) => [line.id, line.amount, line.role, line.direction]),
    [
      ["taxes-related-to-net-share-settlement", -5_960_000_000, "cash-outflow", "outflow"],
      ["dividends-and-dividend-equivalents", -15_421_000_000, "cash-outflow", "outflow"],
      ["common-stock-repurchases", -90_711_000_000, "cash-outflow", "outflow"],
      ["term-debt-issuance-net", 4_481_000_000, "cash-inflow", "inflow"],
      ["term-debt-repayment", -10_932_000_000, "cash-outflow", "outflow"],
      ["commercial-paper-net", -2_032_000_000, "signed-cash-flow", "outflow"],
      ["other-financing-activities", -111_000_000, "signed-cash-flow", "outflow"],
    ],
  );
  assert.equal(
    financing.lines.at(-1).magnitudePercent,
    (111_000_000 / 90_711_000_000) * 100,
  );
});

test("Cash Activity validation fails closed when reviewed line semantics change", () => {
  const cases = [
    () => {
      const statement = makeCashFlowStatement();
      statement.sections[1].lines[0].role = "cash-inflow";
      return statement;
    },
    () => {
      const statement = makeCashFlowStatement();
      statement.sections[2].lines[5].role = "cash-outflow";
      return statement;
    },
    () => {
      const statement = makeCashFlowStatement();
      statement.sections[2].lines[6].id = "commercial-paper-net";
      return statement;
    },
  ];

  for (const createStatement of cases) {
    assert.throws(
      () =>
        buildCashActivityPresentation(createStatement(), {
          fiscalYear: 2025,
          accession: "0000320193-25-000079",
        }),
      CashFlowLearningDataError,
    );
  }
});

test("derivation permits negative Operating Cash Flow instead of assuming Apple is universal", () => {
  const statement = makeCashFlowStatement();
  const operatingTotal = statement.sections[0].lines.find(
    (line) => line.id === "cash-generated-by-operating-activities",
  );
  operatingTotal.value = -1_000_000_000;

  assert.deepEqual(deriveSimpleFreeCashFlow(statement), {
    operatingCashFlow: -1_000_000_000,
    propertyPlantEquipmentPurchases: 12_715_000_000,
    exactValue: -13_715_000_000,
    displayBillions: -13.715,
  });
});

test("rejects bad section order, reconciliation, provenance, and PP&E sign", () => {
  const cases = [
    () => {
      const statement = makeCashFlowStatement();
      statement.sections.reverse();
      return statement;
    },
    () => {
      const statement = makeCashFlowStatement();
      statement.sections[1].lines[0].value += 1;
      return statement;
    },
    () => ({ ...makeCashFlowStatement(), sourceUrl: "https://example.com/filing" }),
    () => {
      const statement = makeCashFlowStatement();
      statement.sections[1].lines[3].value = 12_715_000_000;
      return statement;
    },
  ];

  for (const createStatement of cases) {
    assert.throws(
      () =>
        validateCompleteCashFlowStatement(createStatement(), {
          fiscalYear: 2025,
          accession: "0000320193-25-000079",
        }),
      CashFlowLearningDataError,
    );
  }
});

test("classifies OCF and PP&E as reported inputs and FCF as FinPath-derived", () => {
  const cashFlowStatement = makeCompanyCashFlowStatement();
  const derivation = deriveSimpleFreeCashFlow(cashFlowStatement.statement);
  const evidence = buildFreeCashFlowEvidence({ cashFlowStatement, derivation });

  assert.equal(evidence.kind, "derived");
  assert.equal(evidence.metric.id, "free-cash-flow");
  assert.equal(evidence.calculation.type, "difference-amount");
  assert.equal(evidence.calculation.exactResult, 98_767_000_000);
  assert.equal(evidence.calculation.displayedResult, 98.767);
  assert.deepEqual(
    evidence.inputs.map((input) => [input.metric.id, input.reportedFact.value]),
    [
      ["operating-cash-flow", 111_482_000_000],
      ["pp-and-e-purchases", -12_715_000_000],
    ],
  );
  assert.match(evidence.calculation.definitionNote, /simple educational convention/i);
  assert.match(evidence.limitation, /not.*Apple-reported GAAP metric/i);
});

test("Lesson 08 and 09 content preserves reported, derived, and limitation boundaries", async () => {
  const [investing, freeCashFlow] = await Promise.all([
    readSource("content/cash-flow-lessons/aapl-investing-financing-fy2025.json").then(JSON.parse),
    readSource("content/cash-flow-lessons/aapl-free-cash-flow-fy2025.json").then(JSON.parse),
  ]);

  assert.match(investing.boundaries.investing, /not automatically good or bad/i);
  assert.match(investing.boundaries.financing, /not automatically good or bad/i);
  assert.match(investing.boundaries.operating, /not.*change in Apple.s cash balance/i);
  assert.match(freeCashFlow.definition, /analytical measure/i);
  assert.match(freeCashFlow.definition, /definitions can vary/i);
  assert.match(freeCashFlow.limitation, /not Apple.s ending cash balance/i);
  assert.doesNotMatch(JSON.stringify(investing), /111\.482|15\.195|120\.686|5\.991/);
  assert.doesNotMatch(JSON.stringify(freeCashFlow), /98\.767|111\.482|12\.715/);
});

test("Cash Activity Trace exposes the full lesson immediately with exact shared-scale geometry", async () => {
  const [page, lesson, trace, traceStyles, content] = await Promise.all([
    readSource("app/learn/company-analysis/investing-financing-cash-flow/page.tsx"),
    readSource("components/investing-financing-cash-flow-learning.tsx"),
    readSource("components/cash-activity-trace.tsx"),
    readSource("components/cash-activity-trace.module.css"),
    readSource("content/cash-flow-lessons/aapl-investing-financing-fy2025.json").then(JSON.parse),
  ]);

  assert.match(page, /buildCashActivityPresentation/);
  assert.match(page, /presentation=\{presentation\}/);
  assert.match(lesson, /CashActivityTrace/);
  assert.doesNotMatch(lesson, /visibleSection|firstQuestion|cash-continue/);
  assert.match(lesson, /<details[^>]*className=\{styles\.fullLines\}/);
  assert.match(trace, /payments-for-property-plant-and-equipment/);
  assert.match(trace, /maturities-of-marketable-securities/);
  assert.match(trace, /common-stock-repurchases/);
  assert.match(trace, /term-debt-issuance-net/);
  assert.match(trace, /type="button"/);
  assert.match(trace, /--activity-magnitude/);
  assert.match(traceStyles, /width:\s*calc\(var\(--activity-magnitude\) \* \.5%\)/);
  assert.doesNotMatch(traceStyles, /min-inline-size|width:\s*(?:min|max|clamp)\(/);
  assert.match(content.signBoundary, /direction, not quality/i);
  assert.match(content.fxBoundary, /may include.*exchange-rate effects/i);
  assert.match(content.fxBoundary, /does not.*claim.*exchange-rate effects were zero/i);
  assert.match(content.remainingBoundary, /not automatically good or bad/i);
  assert.equal(
    content.finalQuestion.prompt,
    "Where does Apple report PP&E purchases and share repurchases?",
  );
  assert.doesNotMatch(JSON.stringify(content), /111\.482|15\.195|120\.686|5\.991|90\.711/);
});

test("Cash Activity completion remains submission-only and keeps evidence attached", async () => {
  const lesson = await readSource(
    "components/investing-financing-cash-flow-learning.tsx",
  );

  assert.match(lesson, /function reviewFinalQuestion[\s\S]*markExplored\(\["investing-financing-cash-flow"\]\)/);
  assert.match(lesson, /onSelect=\{setSelectedLineId\}/);
  assert.match(lesson, /EvidenceInspector/);
  assert.match(lesson, /name="ppe-and-share-repurchases"/);
  assert.match(lesson, /finalQuestion\.prompt/);
  assert.doesNotMatch(lesson, /\bFCF\b|stock price|Market Cap|P\/E|BUY|SELL/);
});

test("both lessons use low-pressure checks, evidence, and completion", async () => {
  const [investing, freeCashFlow, investingContent, freeCashFlowContent] = await Promise.all([
    readSource("components/investing-financing-cash-flow-learning.tsx"),
    readSource("components/free-cash-flow-learning.tsx"),
    readSource("content/cash-flow-lessons/aapl-investing-financing-fy2025.json").then(JSON.parse),
    readSource("content/cash-flow-lessons/aapl-free-cash-flow-fy2025.json").then(JSON.parse),
  ]);

  assert.equal(investingContent.finalQuestion.hint, "Choose one. This is practice, not a score.");
  assert.equal(freeCashFlowContent.question.hint, "Choose one. This is practice, not a score.");
  assert.match(investing, /EvidenceInspector/);
  assert.match(freeCashFlow, /EvidenceInspector/);
  assert.doesNotMatch(`${investing}${freeCashFlow}`, /\bXP\b|correct answer/i);
  assert.match(investing, /markExplored\(\["investing-financing-cash-flow"\]\)/);
  assert.match(freeCashFlow, /markExplored\(\["free-cash-flow"\]\)/);
  assert.match(freeCashFlow, /FinPath simple Free Cash Flow/);
});
