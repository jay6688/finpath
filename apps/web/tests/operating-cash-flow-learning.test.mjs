import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildOperatingCashFlowPresentation,
  cashFlowLineMap,
  OperatingCashFlowDataError,
  validateCashFlowStatementForLesson,
} from "../src/lib/operating-cash-flow.ts";


const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

const lineValues = [
  ["net-income", "starting-line", 112_010_000_000],
  ["depreciation-and-amortization", "non-cash-adjustment", 11_698_000_000],
  ["share-based-compensation-expense", "non-cash-adjustment", 12_863_000_000],
  ["other", "non-cash-adjustment", -89_000_000],
  ["accounts-receivable-net", "operating-timing-adjustment", -6_682_000_000],
  ["vendor-non-trade-receivables", "operating-timing-adjustment", -347_000_000],
  ["inventories", "operating-timing-adjustment", 1_400_000_000],
  ["other-current-and-non-current-assets", "operating-timing-adjustment", -9_197_000_000],
  ["accounts-payable", "operating-timing-adjustment", 902_000_000],
  ["other-current-and-non-current-liabilities", "operating-timing-adjustment", -11_076_000_000],
  ["cash-generated-by-operating-activities", "final-total", 111_482_000_000],
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
    sections: [
      {
        id: "operating",
        lines: lineValues.map(([id, role, value]) => ({
          id,
          role,
          value,
          taxonomyTag: `fixture-${id}`,
          taxonomyLabel: `Fixture ${id}`,
        })),
      },
      { id: "investing", lines: [] },
      { id: "financing", lines: [] },
    ],
    cashMovement: {},
  };
}

test("validates the exact FY2025 operating cash reconciliation", () => {
  const statement = makeStatement();

  assert.doesNotThrow(() =>
    validateCashFlowStatementForLesson(statement, {
      fiscalYear: 2025,
      accession: "0000320193-25-000079",
    }),
  );
  const lines = cashFlowLineMap(statement.sections[0].lines);
  assert.equal(lines.get("net-income").value, 112_010_000_000);
  assert.equal(
    lines.get("cash-generated-by-operating-activities").value,
    111_482_000_000,
  );
  assert.equal(
    statement.sections[0].lines.slice(0, -1).reduce((sum, line) => sum + line.value, 0),
    statement.sections[0].lines.at(-1).value,
  );
});

test("builds a domain-explicit signed profit-to-cash presentation", () => {
  const presentation = buildOperatingCashFlowPresentation(makeStatement());

  assert.deepEqual(presentation.startingPoint, {
    id: "net-income",
    kind: "reported-endpoint",
    semanticRole: "starting-point",
    amount: 112_010_000_000,
    evidenceAvailability: "reported",
  });
  assert.deepEqual(presentation.result, {
    id: "cash-generated-by-operating-activities",
    kind: "reported-endpoint",
    semanticRole: "result",
    amount: 111_482_000_000,
    evidenceAvailability: "reported",
  });

  const [nonCash, timing] = presentation.adjustmentGroups;
  assert.deepEqual(
    [nonCash.id, nonCash.semanticRole, nonCash.amount, nonCash.direction],
    ["non-cash-effects", "non-cash-effects", 24_472_000_000, "positive"],
  );
  assert.deepEqual(
    [timing.id, timing.semanticRole, timing.amount, timing.direction],
    ["operating-timing-effects", "operating-timing-effects", -25_000_000_000, "negative"],
  );
  assert.equal(nonCash.kind, "finpath-derived-group");
  assert.equal(timing.kind, "finpath-derived-group");
  assert.equal(nonCash.beforeAmount, 112_010_000_000);
  assert.equal(nonCash.afterAmount, 136_482_000_000);
  assert.equal(nonCash.intermediateAmount, 136_482_000_000);
  assert.equal(timing.beforeAmount, 136_482_000_000);
  assert.equal(timing.afterAmount, 111_482_000_000);
  assert.equal(timing.intermediateAmount, 111_482_000_000);

  assert.deepEqual(
    nonCash.lines.map(({ id, amount, direction, semanticRole, reportedRole }) => ({
      id,
      amount,
      direction,
      semanticRole,
      reportedRole,
    })),
    [
      {
        id: "depreciation-and-amortization",
        amount: 11_698_000_000,
        direction: "positive",
        semanticRole: "non-cash-effect",
        reportedRole: "non-cash-adjustment",
      },
      {
        id: "share-based-compensation-expense",
        amount: 12_863_000_000,
        direction: "positive",
        semanticRole: "non-cash-effect",
        reportedRole: "non-cash-adjustment",
      },
      {
        id: "other",
        amount: -89_000_000,
        direction: "negative",
        semanticRole: "non-cash-effect",
        reportedRole: "non-cash-adjustment",
      },
    ],
  );
  assert.deepEqual(
    timing.lines.map(({ id, amount, direction, semanticRole, reportedRole }) => ({
      id,
      amount,
      direction,
      semanticRole,
      reportedRole,
    })),
    [
      {
        id: "accounts-receivable-net",
        amount: -6_682_000_000,
        direction: "negative",
        semanticRole: "operating-timing-effect",
        reportedRole: "operating-timing-adjustment",
      },
      {
        id: "vendor-non-trade-receivables",
        amount: -347_000_000,
        direction: "negative",
        semanticRole: "operating-timing-effect",
        reportedRole: "operating-timing-adjustment",
      },
      {
        id: "inventories",
        amount: 1_400_000_000,
        direction: "positive",
        semanticRole: "operating-timing-effect",
        reportedRole: "operating-timing-adjustment",
      },
      {
        id: "other-current-and-non-current-assets",
        amount: -9_197_000_000,
        direction: "negative",
        semanticRole: "operating-timing-effect",
        reportedRole: "operating-timing-adjustment",
      },
      {
        id: "accounts-payable",
        amount: 902_000_000,
        direction: "positive",
        semanticRole: "operating-timing-effect",
        reportedRole: "operating-timing-adjustment",
      },
      {
        id: "other-current-and-non-current-liabilities",
        amount: -11_076_000_000,
        direction: "negative",
        semanticRole: "operating-timing-effect",
        reportedRole: "operating-timing-adjustment",
      },
    ],
  );
});

test("uses one truthful adjustment scale without inflating tiny values", () => {
  const presentation = buildOperatingCashFlowPresentation(makeStatement());
  const [nonCash, timing] = presentation.adjustmentGroups;
  const tinyOther = nonCash.lines.find((line) => line.id === "other");

  assert.equal(presentation.adjustmentScale.referenceAmount, 25_000_000_000);
  assert.equal(nonCash.magnitudePercent, 97.888);
  assert.equal(timing.magnitudePercent, 100);
  assert.equal(presentation.netAdjustment.amount, -528_000_000);
  assert.equal(presentation.netAdjustment.direction, "negative");
  assert.equal(presentation.netAdjustment.magnitudePercent, 2.112);
  assert.equal(tinyOther.magnitudePercent, 0.356);
  assert.equal(tinyOther.direction, "negative");
});

test("fails closed on missing, duplicate, misclassified, and unreconciled lines", () => {
  const cases = [
    () => {
      const statement = makeStatement();
      statement.sections[0].lines.splice(3, 1);
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.sections[0].lines[3] = { ...statement.sections[0].lines[2] };
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.sections[0].lines[1].role = "operating-timing-adjustment";
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.sections[0].lines[1].value -= 1;
      return statement;
    },
  ];

  for (const createStatement of cases) {
    assert.throws(
      () =>
        validateCashFlowStatementForLesson(createStatement(), {
          fiscalYear: 2025,
          accession: "0000320193-25-000079",
        }),
      OperatingCashFlowDataError,
    );
  }
});

test("rejects wrong filing identity, order, arithmetic, and provenance", () => {
  const cases = [
    () => ({ ...makeStatement(), accession: "0000320193-24-000123" }),
    () => {
      const statement = makeStatement();
      statement.sections[0].lines.reverse();
      return statement;
    },
    () => {
      const statement = makeStatement();
      statement.sections[0].lines[1].value -= 1;
      return statement;
    },
    () => ({ ...makeStatement(), sourceUrl: "https://example.com/filing" }),
    () => ({
      ...makeStatement(),
      sourceUrl:
        "https://www.sec.gov/Archives/edgar/data/999999/000032019325000079/0000320193-25-000079-index.htm",
    }),
  ];

  for (const createStatement of cases) {
    assert.throws(
      () =>
        validateCashFlowStatementForLesson(createStatement(), {
          fiscalYear: 2025,
          accession: "0000320193-25-000079",
        }),
      OperatingCashFlowDataError,
    );
  }
});

test("reviewed content keeps exact labels and reported-vs-display boundaries", async () => {
  const content = JSON.parse(
    await readSource("content/cash-flow-lessons/aapl-operating-cash-flow-fy2025.json"),
  );
  const labels = Object.values(content.lines).map((line) => line.reportedLabel);

  assert.deepEqual(labels, [
    "Net income",
    "Depreciation and amortization",
    "Share-based compensation expense",
    "Other",
    "Accounts receivable, net",
    "Vendor non-trade receivables",
    "Inventories",
    "Other current and non-current assets",
    "Accounts payable",
    "Other current and non-current liabilities",
    "Cash generated by operating activities",
  ]);
  assert.equal(content.verification.statementName, "Consolidated Statements of Cash Flows");
  assert.match(content.boundary, /not.*total cash movement/i);
  assert.match(content.boundary, /ending cash/i);
  assert.match(content.boundary, /Free Cash Flow/i);
  assert.match(content.boundary, /investment verdict/i);
  assert.match(content.nearCancellation, /particular period/i);
  assert.match(content.groups["non-cash-effects"].explanation, /not fake or unimportant/i);
  assert.match(content.groups["operating-timing-effects"].explanation, /different periods/i);
  assert.match(content.limitation, /does not tell you.*long-term assets/i);
  assert.doesNotMatch(JSON.stringify(content), /112\.010|111\.482|11\.698|6\.682/);
  assert.ok(content.sources.every((source) => new URL(source.url).protocol === "https:"));
});

test("lesson shows the signed trace immediately and preserves deliberate completion", async () => {
  const [component, trace, page, content] = await Promise.all([
    readSource("components/operating-cash-flow-learning.tsx"),
    readSource("components/profit-to-cash-trace.tsx"),
    readSource("app/learn/company-analysis/operating-cash-flow/page.tsx"),
    readSource("content/cash-flow-lessons/aapl-operating-cash-flow-fy2025.json").then(JSON.parse),
  ]);

  assert.match(component, /<ProfitToCashTrace/);
  assert.doesNotMatch(component, /revealedSection|profit-not-cash|Follow the cash bridge/);
  assert.match(component, /useState<CashReconciliationGroupId \| null>\(null\)/);
  assert.match(component, /setSelectedGroupId/);
  assert.match(trace, /role="img"/);
  assert.match(trace, /aria-label=\{textualEquivalent\}/);
  assert.match(trace, /aria-pressed=\{selected\}/);
  assert.match(trace, /type="button"/);
  assert.match(trace, /<details/);
  assert.match(component, /See the complete Apple reconciliation/);
  assert.match(component, /formatReconciliationAmount\(line\.value, line\.role\)/);
  assert.match(component, /role === "starting-line" \|\| role === "final-total"/);
  assert.match(
    page,
    /buildOperatingCashFlowPresentation\(\s*cashFlowStatement\.statement,?\s*\)/,
  );
  assert.equal(content.finalQuestion.hint, "Choose one. This is practice, not a score.");
  assert.match(component, /markExplored\(\["operating-cash-flow"\]\)/);
  assert.equal(
    (component.match(/markExplored\(\["operating-cash-flow"\]\)/g) ?? []).length,
    1,
  );
  assert.match(component, /<EvidenceInspector[^]*evidence=\{operatingCashEvidence\}/);
  assert.doesNotMatch(trace, /markExplored/);
  assert.doesNotMatch(`${component}\n${trace}`, /112\.010|111\.482|24\.472|25\.000|0\.528/);
  assert.doesNotMatch(component, /BUY|SELL|Market Cap|P\/E/i);
});

test("trace styles signed groups from model geometry without cosmetic magnitude", async () => {
  const [trace, styles] = await Promise.all([
    readSource("components/profit-to-cash-trace.tsx"),
    readSource("components/profit-to-cash-trace.module.css"),
  ]);
  const effectRule = styles.match(/\.effectMagnitude\s*\{(?<rule>[^}]*)\}/s)?.groups?.rule;
  const childRule = styles.match(/\.childMagnitude\s*\{(?<rule>[^}]*)\}/s)?.groups?.rule;

  assert.ok(effectRule);
  assert.ok(childRule);
  assert.match(trace, /--effect-magnitude/);
  assert.match(trace, /group\.magnitudePercent/);
  assert.match(trace, /line\.magnitudePercent/);
  assert.match(styles, /width:\s*calc\(var\(--effect-magnitude\) \* 1%\)/);
  assert.doesNotMatch(`${effectRule}\n${childRule}`, /min-width|min-inline-size|clamp/);
  assert.doesNotMatch(trace, /Math\.max|Math\.min/);
  assert.match(styles, /min-block-size:\s*var\(--fp-v2-touch\)/);
  assert.match(styles, /focus-visible/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
});

test("OCF evidence is reported and uses the reusable million-to-billion inspector", async () => {
  const [component, evidence] = await Promise.all([
    readSource("components/operating-cash-flow-learning.tsx"),
    readSource("lib/evidence.ts"),
  ]);

  assert.match(component, /id: "operating-cash-flow", label: "Operating Cash Flow"/);
  assert.match(evidence, /\| "revenue"/);
  assert.match(evidence, /\| "net-income"/);
  assert.match(evidence, /\| "operating-cash-flow"/);
  assert.match(component, /buildReportedEvidence/);
  assert.doesNotMatch(component, /build.*DerivedEvidence/);
});
