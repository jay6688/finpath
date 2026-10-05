import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildProfitLedgerPresentation,
  ProfitLearningDataError,
  validateProfitStatementForLesson,
} from "../src/lib/profit-learning.ts";

const contentUrl = new URL(
  "../src/content/profit-lessons/aapl-profit-fy2025.json",
  import.meta.url,
);
const componentUrl = new URL(
  "../src/components/profit-learning-journey.tsx",
  import.meta.url,
);

const lineValues = [
  ["total-net-sales", "starting-line", 416_161_000_000],
  ["total-cost-of-sales", "deduction", 220_960_000_000],
  ["gross-margin", "subtotal", 195_201_000_000],
  ["total-operating-expenses", "deduction", 62_151_000_000],
  ["operating-income", "subtotal", 133_050_000_000],
  ["other-income-expense-net", "signed-adjustment", -321_000_000],
  ["income-before-income-taxes", "subtotal", 132_729_000_000],
  ["income-tax-provision", "deduction", 20_719_000_000],
  ["net-income", "final-total", 112_010_000_000],
];

function makeStatement() {
  return {
    fiscalYear: 2025,
    startDate: "2024-09-29",
    endDate: "2025-09-27",
    currency: "USD",
    form: "10-K",
    filedAt: "2025-10-31",
    accession: "0000320193-25-000079",
    sourceUrl:
      "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm",
    lines: lineValues.map(([id, role, value]) => ({
      id,
      role,
      value,
      taxonomyTag: `fixture-${id}`,
      taxonomyLabel: `Fixture ${id}`,
    })),
  };
}

test("the reviewed lesson keeps Apple's exact lines, source boundary, and reviewed content", async () => {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));
  const labels = Object.values(content.lines).map((line) => line.reportedLabel);

  assert.deepEqual(labels, [
    "Total net sales",
    "Total cost of sales",
    "Gross margin",
    "Total operating expenses",
    "Operating income",
    "Other income/(expense), net",
    "Income before provision for income taxes",
    "Provision for income taxes",
    "Net income",
  ]);
  assert.match(content.boundary, /does not show when cash moved/i);
  assert.equal(content.accession, "0000320193-25-000079");
  assert.ok(content.sources.every((source) => new URL(source.url).protocol === "https:"));
  assert.match(content.nextPreview, /^Next: Profit Margin/);
  assert.doesNotMatch(content.nextPreview, /\d+\.?\d*%/);
});

test("the Ledger content defines the four accounting transformations in order", async () => {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));

  assert.deepEqual(
    Object.keys(content.ledger.transformations),
    [
      "total-cost-of-sales",
      "total-operating-expenses",
      "other-income-expense-net",
      "income-tax-provision",
    ],
  );
  assert.equal(content.ledger.defaultSelection, "total-cost-of-sales");
  assert.match(content.ledger.scaleNote, /Revenue as the same 100% reference/);
  assert.equal("stages" in content, false);
});

test("the signed Other line and Net Income result retain their distinct teaching roles", async () => {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));
  const other = content.ledger.transformations["other-income-expense-net"];

  assert.match(other.shortLabel, /Other Income \/ \(Expense\)/);
  assert.match(other.explanation, /signed/i);
  assert.match(content.ledger.scaleNote, /locator, not an enlarged block/i);
  assert.match(other.boundary, /sign controls/i);
  assert.equal(content.ledger.result.label, "Net Income");
  assert.match(content.ledger.result.summary, /remainder/i);
  assert.match(content.ledger.result.boundary, /not cash/i);
});

test("the FY2025 Profit path validates exact arithmetic and signed other expense", () => {
  const statement = makeStatement();

  assert.doesNotThrow(() =>
    validateProfitStatementForLesson(statement, {
      fiscalYear: 2025,
      accession: "0000320193-25-000079",
    }),
  );
  assert.equal(statement.lines[5].role, "signed-adjustment");
  assert.equal(statement.lines[5].value, -321_000_000);
  assert.equal(416_161_000_000 - 220_960_000_000, 195_201_000_000);
  assert.equal(195_201_000_000 - 62_151_000_000, 133_050_000_000);
  assert.equal(133_050_000_000 - 321_000_000, 132_729_000_000);
  assert.equal(132_729_000_000 - 20_719_000_000, 112_010_000_000);
});

test("the production presentation model preserves all reviewed lines and roles", () => {
  const model = buildProfitLedgerPresentation(makeStatement());

  assert.equal(model.revenue.id, "total-net-sales");
  assert.equal(model.revenue.reportedAmount, 416_161_000_000);
  assert.equal(model.revenue.presentationShareOfRevenue, 100);
  assert.deepEqual(
    model.lines.map((line) => [line.id, line.semanticRole]),
    [
      ["total-net-sales", "reference"],
      ["total-cost-of-sales", "adjustment"],
      ["gross-margin", "subtotal"],
      ["total-operating-expenses", "adjustment"],
      ["operating-income", "subtotal"],
      ["other-income-expense-net", "signed-adjustment"],
      ["income-before-income-taxes", "subtotal"],
      ["income-tax-provision", "adjustment"],
      ["net-income", "result"],
    ],
  );
  assert.equal(model.result.id, "net-income");
  assert.equal(model.result.semanticRole, "result");
  assert.equal(model.result.evidenceAvailability, "available");
});

test("Revenue is the exact 100 percent reference with no cosmetic minimum", () => {
  const statement = makeStatement();
  const model = buildProfitLedgerPresentation(statement);
  const revenue = statement.lines[0].value;

  assert.deepEqual(
    model.composition.map((line) => line.id),
    [
      "total-cost-of-sales",
      "total-operating-expenses",
      "other-income-expense-net",
      "income-tax-provision",
      "net-income",
    ],
  );

  for (const line of model.composition) {
    assert.equal(
      line.presentationShareOfRevenue,
      (Math.abs(line.reportedAmount) / revenue) * 100,
    );
    assert.equal("minimumPercent" in line, false);
  }

  const other = model.composition[2];
  assert.equal(other.geometryKind, "locator");
  assert.equal(other.presentationShareOfRevenue, (321_000_000 / revenue) * 100);
  assert.ok(other.presentationShareOfRevenue > 0.07);
  assert.ok(other.presentationShareOfRevenue < 0.08);
  assert.equal(
    other.locatorPositionPercentOfRevenue,
    ((revenue - 133_050_000_000) / revenue) * 100,
  );
  assert.equal(
    model.composition.reduce(
      (sum, line) => sum + line.presentationShareOfRevenue,
      0,
    ),
    100,
  );
  assert.notEqual(
    other.presentationShareOfRevenue,
    Number(other.presentationShareOfRevenue.toFixed(2)),
  );
});

test("the four selectable lines expose exact Before Adjustment After identities", () => {
  const model = buildProfitLedgerPresentation(makeStatement());

  assert.deepEqual(
    model.transformations.map((transformation) => ({
      id: transformation.id,
      before: [transformation.before.id, transformation.before.reportedAmount],
      adjustment: [
        transformation.adjustment.id,
        transformation.adjustment.reportedAmount,
      ],
      after: [transformation.after.id, transformation.after.reportedAmount],
      operation: transformation.operation,
      effectSign: transformation.effectSign,
    })),
    [
      {
        id: "total-cost-of-sales",
        before: ["total-net-sales", 416_161_000_000],
        adjustment: ["total-cost-of-sales", 220_960_000_000],
        after: ["gross-margin", 195_201_000_000],
        operation: "subtract",
        effectSign: "negative",
      },
      {
        id: "total-operating-expenses",
        before: ["gross-margin", 195_201_000_000],
        adjustment: ["total-operating-expenses", 62_151_000_000],
        after: ["operating-income", 133_050_000_000],
        operation: "subtract",
        effectSign: "negative",
      },
      {
        id: "other-income-expense-net",
        before: ["operating-income", 133_050_000_000],
        adjustment: ["other-income-expense-net", -321_000_000],
        after: ["income-before-income-taxes", 132_729_000_000],
        operation: "add-signed",
        effectSign: "negative",
      },
      {
        id: "income-tax-provision",
        before: ["income-before-income-taxes", 132_729_000_000],
        adjustment: ["income-tax-provision", 20_719_000_000],
        after: ["net-income", 112_010_000_000],
        operation: "subtract",
        effectSign: "negative",
      },
    ],
  );
  assert.equal(
    model.transformations.some((transformation) => transformation.id === "net-income"),
    false,
  );
});

test("a synthetic positive Other line remains a signed addition, not a deduction", () => {
  const statement = makeStatement();
  statement.lines[5].value = 321_000_000;
  statement.lines[6].value = 133_371_000_000;
  statement.lines[8].value = 112_652_000_000;

  const model = buildProfitLedgerPresentation(statement);
  const other = model.lines.find((line) => line.id === "other-income-expense-net");
  const transformation = model.transformations.find(
    (candidate) => candidate.id === "other-income-expense-net",
  );

  assert.equal(other.semanticRole, "signed-adjustment");
  assert.equal(other.reportedSign, "positive");
  assert.equal(transformation.operation, "add-signed");
  assert.equal(transformation.effectSign, "positive");
  assert.equal(transformation.adjustment.reportedAmount, 321_000_000);
});

test("the lesson rejects mismatched filing, bad ordering, bad arithmetic, and non-SEC provenance", () => {
  const cases = [
    () => {
      const statement = makeStatement();
      statement.accession = "0000320193-24-000123";
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.lines = statement.lines.slice().reverse();
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.lines.at(-1).value += 1;
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.sourceUrl = "https://example.com/filing";
      return statement;
    },
  ];

  for (const createStatement of cases) {
    assert.throws(
      () =>
        validateProfitStatementForLesson(createStatement(), {
          fiscalYear: 2025,
          accession: "0000320193-25-000079",
        }),
      ProfitLearningDataError,
    );
  }
});

test("the concept check is low-pressure and the component exposes feedback and provenance", async () => {
  const [content, component] = await Promise.all([
    readFile(contentUrl, "utf8").then(JSON.parse),
    readFile(componentUrl, "utf8"),
  ]);

  assert.equal(content.question.supportedChoiceId, "could-fall");
  assert.match(content.question.hint, /practice, not a score/i);
  assert.match(content.question.supportedFeedback, /Net Income may be lower/);
  assert.doesNotMatch(
    JSON.stringify(content.question),
    /\b(?:XP|grade|failed)\b/i,
  );
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /role="status"/);
  assert.match(component, /href=\{statement\.sourceUrl\}/);
  assert.match(component, /Open official SEC filing index/);

  const evidenceIndex = component.indexOf("<EvidenceInspector");
  const conceptCheckIndex = component.indexOf("className={styles.understanding}");
  const exactRecordIndex = component.indexOf("className={styles.exactRecord}");

  assert.ok(evidenceIndex > 0);
  assert.ok(conceptCheckIndex > evidenceIndex);
  assert.ok(exactRecordIndex > conceptCheckIndex);
});

test("Profit progress is marked only by explicit completion after every transformation", async () => {
  const component = await readFile(componentUrl, "utf8");
  const progressCalls = component.match(/markExplored\(\["profit"\]\)/g) ?? [];
  const selectLine = component.slice(
    component.indexOf("function selectLine"),
    component.indexOf("function completeLesson"),
  );
  const completeLesson = component.slice(
    component.indexOf("function completeLesson"),
    component.indexOf("function reviewUnderstanding"),
  );

  assert.equal(progressCalls.length, 1);
  assert.doesNotMatch(selectLine, /markExplored/);
  assert.match(completeLesson, /if \(!allTransformationsInspected\) return/);
  assert.match(completeLesson, /markExplored\(\["profit"\]\)/);
});
