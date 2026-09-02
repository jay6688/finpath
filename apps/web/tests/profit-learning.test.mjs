import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ProfitLearningDataError,
  visibleProfitLineIds,
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

test("progressive reveal keeps every previous income-statement line visible", async () => {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));

  assert.deepEqual(
    content.stages.map((_, index) =>
      visibleProfitLineIds(content.stages, index).length,
    ),
    [1, 3, 5, 9],
  );
  assert.deepEqual(visibleProfitLineIds(content.stages, 3), lineValues.map(([id]) => id));
});

test("the FY2025 Profit path validates exact arithmetic and signed other expense", () => {
  const statement = makeStatement();

  assert.doesNotThrow(() =>
    validateProfitStatementForLesson(statement, {
      fiscalYear: 2025,
      accession: "0000320193-25-000079",
    }),
  );
  assert.equal(statement.lines[5].value, -321_000_000);
  assert.equal(416_161_000_000 - 220_960_000_000, 195_201_000_000);
  assert.equal(195_201_000_000 - 62_151_000_000, 133_050_000_000);
  assert.equal(133_050_000_000 - 321_000_000, 132_729_000_000);
  assert.equal(132_729_000_000 - 20_719_000_000, 112_010_000_000);
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
  const [content, component, upNext] = await Promise.all([
    readFile(contentUrl, "utf8").then(JSON.parse),
    readFile(componentUrl, "utf8"),
    readFile(new URL("../src/components/learning-up-next.tsx", import.meta.url), "utf8"),
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
  assert.match(component, /LearningUpNext currentConceptId="profit"/);
  assert.match(upNext, /deriveUpNextModel/);
});
