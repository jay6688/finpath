import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
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

test("both lessons use progressive sections, low-pressure checks, evidence, and completion", async () => {
  const [investing, freeCashFlow, investingContent, freeCashFlowContent] = await Promise.all([
    readSource("components/investing-financing-cash-flow-learning.tsx"),
    readSource("components/free-cash-flow-learning.tsx"),
    readSource("content/cash-flow-lessons/aapl-investing-financing-fy2025.json").then(JSON.parse),
    readSource("content/cash-flow-lessons/aapl-free-cash-flow-fy2025.json").then(JSON.parse),
  ]);

  assert.equal(investingContent.firstQuestion.hint, "Choose one. This is practice, not a score.");
  assert.equal(investingContent.finalQuestion.hint, "Choose one. This is practice, not a score.");
  assert.equal(freeCashFlowContent.question.hint, "Choose one. This is practice, not a score.");
  assert.match(investing, /EvidenceInspector/);
  assert.match(freeCashFlow, /EvidenceInspector/);
  assert.doesNotMatch(`${investing}${freeCashFlow}`, /\bXP\b|correct answer/i);
  assert.match(investing, /markExplored\(\["investing-financing-cash-flow"\]\)/);
  assert.match(freeCashFlow, /markExplored\(\["free-cash-flow"\]\)/);
  assert.match(freeCashFlow, /FinPath simple Free Cash Flow/);
});
