import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  deriveNetProfitMargin,
  ProfitMarginDataError,
} from "../src/lib/profit-margin.ts";


const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

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

test("derives Apple's FY2025 Net Profit Margin from Revenue and Net Income", () => {
  const result = deriveNetProfitMargin(makeStatement());

  assert.equal(result.revenue, 416_161_000_000);
  assert.equal(result.netIncome, 112_010_000_000);
  assert.ok(Math.abs(result.exactPercent - 26.915064121818238) < 1e-12);
  assert.equal(result.verificationPercent, 26.915);
  assert.equal(result.displayPercent, 26.9);
  assert.equal(result.perHundredRevenue, 26.9);
});

test("rejects missing, duplicate, zero, negative, and unsuitable inputs", () => {
  const invalidStatements = [
    () => {
      const statement = makeStatement();
      statement.lines = statement.lines.filter((line) => line.id !== "net-income");
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.lines.push({ ...statement.lines[0] });
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.lines[0].value = 0;
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.lines.at(-1).value = -1;
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.lines.at(-1).value = statement.lines[0].value + 1;
      return statement;
    },
  ];

  for (const makeInvalidStatement of invalidStatements) {
    assert.throws(
      () => deriveNetProfitMargin(makeInvalidStatement()),
      ProfitMarginDataError,
    );
  }
});

test("reviewed content keeps reported facts, derived calculation, and limitations separate", async () => {
  const content = JSON.parse(
    await readSource("content/profit-margin-lessons/aapl-profit-margin-fy2025.json"),
  );
  const serialized = JSON.stringify(content);

  assert.equal(content.accession, "0000320193-25-000079");
  assert.match(content.formula.heading, /derived/i);
  assert.match(content.terminology, /uses Net Income/i);
  assert.match(content.terminology, /not Apple’s ‘Gross margin’ dollar subtotal/i);
  assert.match(content.ratioBoundary, /does not mean.*cash/i);
  assert.match(content.limitation, /does not explain why the margin changed/i);
  assert.doesNotMatch(serialized, /416\.161|112\.010|26\.9/);
  assert.ok(content.sources.every((source) => new URL(source.url).protocol === "https:"));
});

test("the lesson implements discovery, one low-pressure application, and reusable evidence", async () => {
  const [component, evidenceComponent, page, profitJourney, upNext, content] = await Promise.all([
    readSource("components/profit-margin-learning.tsx"),
    readSource("components/evidence-inspector.tsx"),
    readSource("app/company/aapl/profit-margin/page.tsx"),
    readSource("components/profit-learning-journey.tsx"),
    readSource("components/learning-up-next.tsx"),
    readSource("content/profit-margin-lessons/aapl-profit-margin-fy2025.json").then(JSON.parse),
  ]);

  assert.match(component, /setIsRevealed\(true\)/);
  assert.match(component, /setReviewedChoice\(null\)/);
  assert.match(component, /Check my reasoning/);
  assert.match(content.question.hint, /practice, not a score/i);
  assert.match(component, /Static ratio visualization/);
  assert.doesNotMatch(component, /type="range"|role="slider"/);
  assert.match(component, /<EvidenceInspector evidence=\{marginEvidence\}/);
  assert.match(evidenceComponent, /href=\{evidence\.filing\.sourceUrl\}/);
  assert.match(evidenceComponent, /Open SEC filing index/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /role="status"/);
  assert.doesNotMatch(component, /SEC source connected/);
  assert.match(page, /deriveNetProfitMargin\(incomeStatement\.statement\)/);
  assert.match(profitJourney, /LearningUpNext currentConceptId="profit"/);
  assert.match(component, /LearningUpNext currentConceptId="net-profit-margin"/);
  assert.match(upNext, /deriveUpNextModel/);
});
