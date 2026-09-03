import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildNetProfitMarginEvidence,
  buildReportedEvidence,
  buildRevenueGrowthEvidence,
  buildReviewedPresentation,
  EvidenceDataError,
} from "../src/lib/evidence.ts";

const filingUrl =
  "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm";
const company = { ticker: "AAPL", name: "Apple Inc.", cik: "0000320193" };
const dataStatus = { state: "live", retrievedAt: "2026-09-03T01:02:03Z" };

const lines = [
  ["total-net-sales", "starting-line", 416_161_000_000, "RevenueFromContractWithCustomerExcludingAssessedTax"],
  ["total-cost-of-sales", "deduction", 220_960_000_000, "CostOfGoodsAndServicesSold"],
  ["gross-margin", "subtotal", 195_201_000_000, "GrossProfit"],
  ["net-income", "final-total", 112_010_000_000, "NetIncomeLoss"],
];

const labels = {
  "total-net-sales": "Total net sales",
  "total-cost-of-sales": "Total cost of sales",
  "gross-margin": "Gross margin",
  "net-income": "Net income",
};

function makeStatement() {
  return {
    fiscalYear: 2025,
    startDate: "2024-09-29",
    endDate: "2025-09-27",
    currency: "USD",
    form: "10-K",
    filedAt: "2025-10-31",
    accession: "0000320193-25-000079",
    sourceUrl: filingUrl,
    lines: lines.map(([id, role, value, taxonomyTag]) => ({
      id,
      role,
      value,
      taxonomyTag,
      taxonomyLabel: `Taxonomy ${id}`,
    })),
  };
}

function makeIncomeStatement() {
  return { company, statement: makeStatement(), dataStatus };
}

function makeReviewed(statement = makeStatement(), lineId = "total-net-sales") {
  return buildReviewedPresentation({
    statement,
    content: {
      fiscalYear: 2025,
      startDate: "2024-09-29",
      endDate: "2025-09-27",
      form: "10-K",
      filedAt: "2025-10-31",
      accession: "0000320193-25-000079",
      statementName: "Consolidated Statements of Operations",
      labels,
    },
    lineId,
    contextLineIds:
      lineId === "total-net-sales"
        ? ["total-net-sales", "total-cost-of-sales", "gross-margin"]
        : ["net-income"],
  });
}

function makeRevenueFact(overrides = {}) {
  return {
    fiscalYear: 2025,
    startDate: "2024-09-29",
    endDate: "2025-09-27",
    value: 416_161_000_000,
    form: "10-K",
    filedAt: "2025-10-31",
    accession: "0000320193-25-000079",
    sourceUrl: filingUrl,
    taxonomyTag: "RevenueFromContractWithCustomerExcludingAssessedTax",
    ...overrides,
  };
}

function makeRevenueEvidence(overrides = {}) {
  return buildReportedEvidence({
    metric: { id: "revenue", label: "Revenue" },
    company,
    currency: "USD",
    fact: makeRevenueFact(),
    dataStatus,
    reviewedPresentation: makeReviewed(),
    ...overrides,
  });
}

test("builds distinct Revenue and Net Income reported evidence with exact unit formatting", () => {
  const revenue = makeRevenueEvidence();
  const statement = makeStatement();
  const netIncomeLine = statement.lines.find((line) => line.id === "net-income");
  const netIncome = buildReportedEvidence({
    metric: { id: "net-income", label: "Net Income" },
    company,
    currency: "USD",
    fact: {
      ...makeRevenueFact(),
      value: netIncomeLine.value,
      taxonomyTag: netIncomeLine.taxonomyTag,
    },
    dataStatus,
    reviewedPresentation: makeReviewed(statement, "net-income"),
  });

  assert.equal(revenue.kind, "reported");
  assert.equal(revenue.finPathDisplay.value, 416.161);
  assert.equal(revenue.reviewedPresentation.reportedLabel, "Total net sales");
  assert.equal(revenue.transformation.inputValue, 416_161);
  assert.equal(revenue.transformation.divisor, 1_000);
  assert.equal(revenue.transformation.outputValue, 416.161);
  assert.equal(revenue.transformation.note, "Formatting only. No financial estimate.");
  assert.equal(netIncome.finPathDisplay.value, 112.01);
  assert.equal(netIncome.reviewedPresentation.reportedLabel, "Net income");
  assert.notEqual(revenue.finPathDisplay.scale, revenue.transformation.inputScale);
});

test("suppresses reviewed labels and context on filing or period mismatch", () => {
  const reviewed = makeReviewed();
  const wrongFiling = makeRevenueEvidence({
    fact: makeRevenueFact({
      accession: "0000320193-24-000123",
      sourceUrl:
        "https://www.sec.gov/Archives/edgar/data/320193/000032019324000123/0000320193-24-000123-index.htm",
    }),
    reviewedPresentation: reviewed,
  });
  const wrongPeriod = makeRevenueEvidence({
    fact: makeRevenueFact({ startDate: "2023-10-01", endDate: "2024-09-28" }),
    reviewedPresentation: reviewed,
  });

  for (const evidence of [wrongFiling, wrongPeriod]) {
    assert.equal(evidence.reviewedPresentation, undefined);
    assert.equal(evidence.sourceCapability.reviewedPresentation, "unavailable");
    assert.equal(evidence.transformation.inputScale, "whole USD");
  }
});

test("prevents unsafe unit conversion and omits invalid or missing source actions", () => {
  assert.throws(() => makeRevenueEvidence({ currency: "EUR" }), EvidenceDataError);

  for (const sourceUrl of [undefined, "https://example.com/filing", "https://www.sec.gov/"]) {
    const evidence = makeRevenueEvidence({
      fact: makeRevenueFact({ sourceUrl }),
      reviewedPresentation: null,
    });
    assert.equal(evidence.filing.sourceUrl, undefined);
    assert.equal(evidence.sourceCapability.filingLink, "unavailable");
  }

  const wrongCompanyPath = makeRevenueEvidence({
    fact: makeRevenueFact({
      sourceUrl:
        "https://www.sec.gov/Archives/edgar/data/999999/000032019325000079/0000320193-25-000079-index.htm",
    }),
  });
  assert.equal(wrongCompanyPath.filing.sourceUrl, undefined);
  assert.equal(wrongCompanyPath.reviewedPresentation, undefined);
});

test("an unsupported taxonomy tag cannot inherit a reviewed Apple label", () => {
  const evidence = makeRevenueEvidence({
    fact: makeRevenueFact({ taxonomyTag: "UnsupportedRevenueTag" }),
  });

  assert.equal(evidence.reviewedPresentation, undefined);
  assert.equal(evidence.sourceCapability.reviewedPresentation, "unavailable");
});

test("preserves stale source state without changing the reported value", () => {
  const evidence = makeRevenueEvidence({
    dataStatus: { state: "stale", retrievedAt: "2026-09-02T10:00:00Z" },
  });

  assert.equal(evidence.dataStatus.state, "stale");
  assert.equal(evidence.dataStatus.retrievedAt, "2026-09-02T10:00:00Z");
  assert.equal(evidence.reportedFact.value, 416_161_000_000);
});

test("builds Net Profit Margin only from matching reported Revenue and Net Income", () => {
  const incomeStatement = makeIncomeStatement();
  const exactPercent = (112_010_000_000 / 416_161_000_000) * 100;
  const evidence = buildNetProfitMarginEvidence({
    incomeStatement,
    derivation: {
      revenue: 416_161_000_000,
      netIncome: 112_010_000_000,
      exactPercent,
      verificationPercent: 26.915,
      displayPercent: 26.9,
      perHundredRevenue: 26.9,
    },
    reviewedRevenue: makeReviewed(incomeStatement.statement, "total-net-sales"),
    reviewedNetIncome: makeReviewed(incomeStatement.statement, "net-income"),
  });

  assert.equal(evidence.kind, "derived");
  assert.equal(evidence.metric.id, "net-profit-margin");
  assert.equal(evidence.calculation.formula, "Net Income ÷ Revenue × 100");
  assert.equal(evidence.calculation.exactResult, exactPercent);
  assert.equal(evidence.calculation.displayedResult, 26.9);
  assert.ok(evidence.inputs.every((input) => input.kind === "reported"));
  assert.match(evidence.limitation, /Apple reported the inputs, not this ratio/i);

  assert.throws(
    () =>
      buildNetProfitMarginEvidence({
        incomeStatement,
        derivation: {
          revenue: 416_161_000_000,
          netIncome: 1,
          exactPercent: 1,
          verificationPercent: 1,
          displayPercent: 1,
          perHundredRevenue: 1,
        },
      }),
    EvidenceDataError,
  );

  const missingInput = makeIncomeStatement();
  missingInput.statement.lines = missingInput.statement.lines.filter(
    (line) => line.id !== "net-income",
  );
  assert.throws(
    () =>
      buildNetProfitMarginEvidence({
        incomeStatement: missingInput,
        derivation: {
          revenue: 416_161_000_000,
          netIncome: 112_010_000_000,
          exactPercent,
          verificationPercent: 26.915,
          displayPercent: 26.9,
          perHundredRevenue: 26.9,
        },
      }),
    EvidenceDataError,
  );
});

test("Revenue Growth uses two reported inputs and preserves each selected accession", () => {
  const previous = makeRevenueFact({
    fiscalYear: 2024,
    startDate: "2023-10-01",
    endDate: "2024-09-28",
    value: 391_035_000_000,
    accession: "0000320193-25-000079",
  });
  const current = makeRevenueFact();
  const percentageChange = ((current.value - previous.value) / previous.value) * 100;
  const evidence = buildRevenueGrowthEvidence({
    row: {
      state: "available",
      fiscalYear: 2025,
      previous,
      current,
      absoluteChange: current.value - previous.value,
      percentageChange,
      direction: "increase",
    },
    company,
    currency: "USD",
    taxonomyTag: current.taxonomyTag,
    dataStatus,
    reviewedPresentation: makeReviewed(),
  });

  assert.equal(evidence.kind, "derived");
  assert.equal(evidence.inputs.length, 2);
  assert.deepEqual(
    evidence.inputs.map((input) => input.filing.accession),
    [previous.accession, current.accession],
  );
  assert.equal(evidence.inputs[0].reviewedPresentation, undefined);
  assert.equal(evidence.inputs[1].reviewedPresentation.reportedLabel, "Total net sales");
  assert.equal(evidence.calculation.displayedResult, 6.4);
  assert.match(evidence.limitation, /does not explain why Revenue changed/i);
});

test("reviewed context requires accession-bound content and complete runtime lines", () => {
  const statement = makeStatement();
  assert.equal(makeReviewed(statement).contextLines.length, 3);

  assert.equal(
    buildReviewedPresentation({
      statement,
      content: {
        fiscalYear: 2024,
        startDate: statement.startDate,
        endDate: statement.endDate,
        form: statement.form,
        filedAt: statement.filedAt,
        accession: statement.accession,
        statementName: "Consolidated Statements of Operations",
        labels,
      },
      lineId: "total-net-sales",
      contextLineIds: ["total-net-sales"],
    }),
    null,
  );
  assert.equal(
    buildReviewedPresentation({
      statement,
      content: {
        fiscalYear: 2025,
        startDate: statement.startDate,
        endDate: statement.endDate,
        form: statement.form,
        filedAt: statement.filedAt,
        accession: statement.accession,
        statementName: "",
        labels,
      },
      lineId: "total-net-sales",
      contextLineIds: ["total-net-sales"],
    }),
    null,
  );
  assert.equal(
    buildReviewedPresentation({
      statement,
      content: {
        fiscalYear: 2025,
        startDate: statement.startDate,
        endDate: "2025-09-26",
        form: statement.form,
        filedAt: statement.filedAt,
        accession: statement.accession,
        statementName: "Consolidated Statements of Operations",
        labels,
      },
      lineId: "total-net-sales",
      contextLineIds: ["total-net-sales"],
    }),
    null,
  );
  assert.equal(
    buildReviewedPresentation({
      statement,
      content: {
        fiscalYear: 2025,
        startDate: statement.startDate,
        endDate: statement.endDate,
        form: statement.form,
        filedAt: statement.filedAt,
        accession: statement.accession,
        statementName: "Consolidated Statements of Operations",
        labels: { ...labels, "total-net-sales": "" },
      },
      lineId: "total-net-sales",
      contextLineIds: ["total-net-sales"],
    }),
    null,
  );
});

test("the reported inspector teaches the reviewed million-to-billion conversion first", async () => {
  const component = await readFile(
    new URL("../src/components/evidence-inspector.tsx", import.meta.url),
    "utf8",
  );

  assert.match(component, /How FinPath got this number/);
  assert.match(component, /Apple reported/);
  assert.match(component, /FinPath shows/);
  assert.match(component, /1 billion = 1,000 million/);
  assert.match(component, /million ÷/);
  assert.match(component, /= \{formatBillions\(evidence\.transformation\.outputValue\)\.replace\("B", " billion"\)\}/);
  assert.match(component, /Same \{evidence\.metric\.label\}\. Different display unit\./);
  assert.match(component, /evidence\.transformation\.note/);
  assert.match(component, /See the statement lines FinPath used/);
  assert.match(component, /Source details/);
  assert.match(component, /Technical details/);
  assert.doesNotMatch(component, /Why they match/);
});

test("the reusable UI keeps source context, fallback, and Level 3 boundaries honest", async () => {
  const component = await readFile(
    new URL("../src/components/evidence-inspector.tsx", import.meta.url),
    "utf8",
  );

  assert.match(component, /How FinPath calculated this/);
  assert.match(component, /data-evidence-kind="reported"/);
  assert.match(component, /data-evidence-kind="derived"/);
  assert.match(component, /FinPath-rendered context from Apple’s reviewed filing/);
  assert.match(component, /Not a filing screenshot or exact HTML locator/);
  assert.match(component, /reviewed Apple statement presentation is unavailable/);
  assert.match(component, /does not show an Apple filing label or recreate its statement context/);
  assert.match(component, /Apple reported the inputs\. FinPath calculated the result\./);
  assert.match(component, /FinPath uses the selected reported fact currently attached to this fiscal-year record\./);
  assert.match(component, /href=\{evidence\.filing\.sourceUrl\}/);
  assert.doesNotMatch(component, /<details[^>]+open(?:=|\s|>)/);
  assert.doesNotMatch(component, /SEC Verified|Trust score|Certified|Guaranteed accurate/i);
  assert.doesNotMatch(component, /contextRef|unitRef|source excerpt|exact SEC row|exact SEC HTML location/i);
});
