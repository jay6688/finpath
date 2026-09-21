import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { makeCompanyCashFlowStatement } from "./cash-flow-fixture.mjs";
import {
  buildThreeStatementConnectionData,
  ThreeStatementDataError,
} from "../src/lib/three-statements.ts";

const filingUrl =
  "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm";
const company = { ticker: "AAPL", name: "Apple Inc.", cik: "0000320193" };
const dataStatus = { state: "cached", retrievedAt: "2026-09-21T00:00:00Z" };

function incomeLine(id, role, value) {
  return { id, role, value, taxonomyTag: `fixture-${id}`, taxonomyLabel: `Fixture ${id}` };
}

function makeIncomeStatement() {
  return {
    company,
    dataStatus,
    statement: {
      fiscalYear: 2025,
      startDate: "2024-09-29",
      endDate: "2025-09-27",
      currency: "USD",
      form: "10-K",
      filedAt: "2025-10-31",
      accession: "0000320193-25-000079",
      sourceUrl: filingUrl,
      lines: [
        incomeLine("total-net-sales", "starting-line", 416_161_000_000),
        incomeLine("total-cost-of-sales", "deduction", 220_960_000_000),
        incomeLine("gross-margin", "subtotal", 195_201_000_000),
        incomeLine("total-operating-expenses", "deduction", 62_151_000_000),
        incomeLine("operating-income", "subtotal", 133_050_000_000),
        incomeLine("other-income-expense-net", "signed-adjustment", -321_000_000),
        incomeLine("income-before-income-taxes", "subtotal", 132_729_000_000),
        incomeLine("income-tax-provision", "deduction", 20_719_000_000),
        incomeLine("net-income", "final-total", 112_010_000_000),
      ],
    },
  };
}

function reported(id, value, role, label) {
  return {
    evidenceKind: "reported",
    id,
    taxonomyTag: `fixture-${id}`,
    taxonomyLabel: `Fixture ${id}`,
    reportedLabel: label,
    value,
    role,
  };
}

function makeBalanceSheet() {
  const borrowings = [
    reported("commercial-paper", 7_979_000_000, "borrowing-component", "Commercial paper"),
    reported("current-term-debt", 12_350_000_000, "borrowing-component", "Current term debt"),
    reported("noncurrent-term-debt", 78_328_000_000, "borrowing-component", "Non-current term debt"),
  ];
  return {
    company,
    dataStatus,
    statement: {
      fiscalYear: 2025,
      asOfDate: "2025-09-27",
      currency: "USD",
      form: "10-K",
      filedAt: "2025-10-31",
      accession: "0000320193-25-000079",
      sourceUrl: filingUrl,
      statementName: "Consolidated Balance Sheets",
      assets: reported("total-assets", 359_241_000_000, "assets", "Total assets"),
      liabilities: reported("total-liabilities", 285_508_000_000, "liabilities", "Total liabilities"),
      otherClaims: [],
      equity: reported("shareholders-equity", 73_733_000_000, "equity", "Total shareholders’ equity"),
      cashAndCashEquivalents: reported("cash-and-cash-equivalents", 35_934_000_000, "supporting-fact", "Cash and cash equivalents"),
      supplementalFinancialAssets: [
        reported("current-marketable-securities", 18_763_000_000, "supplemental-financial-asset", "Current marketable securities"),
        reported("noncurrent-marketable-securities", 77_723_000_000, "supplemental-financial-asset", "Non-current marketable securities"),
      ],
      simpleBorrowings: {
        evidenceKind: "derived",
        id: "simple-borrowings",
        label: "FinPath simple borrowings",
        value: 98_657_000_000,
        formula: "Commercial paper + Current term debt + Non-current term debt",
        definition: "The sum of the reviewed borrowing lines used in this lesson.",
        inputs: borrowings,
      },
    },
  };
}

function makeResponses() {
  const cashFlow = makeCompanyCashFlowStatement();
  cashFlow.dataStatus = dataStatus;
  return { incomeStatement: makeIncomeStatement(), cashFlowStatement: cashFlow, balanceSheet: makeBalanceSheet() };
}

test("connects one reviewed filing without inventing a derived metric", () => {
  const result = buildThreeStatementConnectionData(makeResponses());

  assert.equal(result.company.ticker, "AAPL");
  assert.equal(result.filing.accession, "0000320193-25-000079");
  assert.equal(result.values.netIncome, 112_010_000_000);
  assert.equal(result.values.operatingCashFlow, 111_482_000_000);
  assert.equal(result.values.investingCashFlow, 15_195_000_000);
  assert.equal(result.values.financingCashFlow, -120_686_000_000);
  assert.equal(result.values.netChangeInCash, 5_991_000_000);
  assert.equal(result.values.beginningCash, 29_943_000_000);
  assert.equal(result.values.endingCash, 35_934_000_000);
  assert.equal(result.connections.length, 2);
  assert.deepEqual(result.connections.map((connection) => connection.status), ["exact-match", "exact-match"]);
  assert.equal(result.connections[0].source.evidence.kind, "reported");
  assert.equal(result.connections[0].target.evidence.kind, "reported");
  assert.equal(result.connections[1].source.evidence.kind, "reported");
  assert.equal(result.connections[1].target.evidence.kind, "reported");
  assert.equal(
    result.values.operatingCashFlow + result.values.investingCashFlow + result.values.financingCashFlow,
    result.values.netChangeInCash,
  );
  assert.equal(result.values.beginningCash + result.values.netChangeInCash, result.values.endingCash);
});

test("rejects cross-company identity and filing mismatches", () => {
  const mutations = [
    (set) => { set.cashFlowStatement.company.ticker = "MSFT"; },
    (set) => { set.balanceSheet.company.cik = "0000789019"; },
    (set) => { set.cashFlowStatement.statement.fiscalYear = 2024; },
    (set) => { set.balanceSheet.statement.form = "10-K/A"; },
    (set) => { set.incomeStatement.statement.filedAt = "2025-11-01"; },
    (set) => { set.balanceSheet.statement.accession = "0000320193-25-000080"; },
  ];
  for (const mutate of mutations) {
    const set = structuredClone(makeResponses());
    mutate(set);
    assert.throws(() => buildThreeStatementConnectionData(set), ThreeStatementDataError);
  }
});

test("rejects incompatible duration and instant contexts", () => {
  const mutations = [
    (set) => { set.cashFlowStatement.statement.startDate = "2024-09-30"; },
    (set) => { set.incomeStatement.statement.endDate = "2025-09-26"; },
    (set) => { set.balanceSheet.statement.asOfDate = "2025-09-26"; },
    (set) => { set.cashFlowStatement.statement.cashMovement.endingCash.asOfDate = "2025-09-26"; },
  ];
  for (const mutate of mutations) {
    const set = structuredClone(makeResponses());
    mutate(set);
    assert.throws(() => buildThreeStatementConnectionData(set), ThreeStatementDataError);
  }
});

test("rejects Net Income and ending-cash bridge mismatches", () => {
  const netIncomeMismatch = structuredClone(makeResponses());
  netIncomeMismatch.cashFlowStatement.statement.sections[0].lines[0].value += 1;
  netIncomeMismatch.cashFlowStatement.statement.sections[0].lines[3].value -= 1;
  assert.throws(
    () => buildThreeStatementConnectionData(netIncomeMismatch),
    /Net Income/i,
  );

  const endingCashMismatch = structuredClone(makeResponses());
  endingCashMismatch.balanceSheet.statement.cashAndCashEquivalents.value += 1;
  assert.throws(
    () => buildThreeStatementConnectionData(endingCashMismatch),
    /ending cash/i,
  );
});

test("rejects missing or duplicate bridge facts and unsafe filing URLs", () => {
  const missingNetIncome = structuredClone(makeResponses());
  missingNetIncome.incomeStatement.statement.lines.pop();
  assert.throws(() => buildThreeStatementConnectionData(missingNetIncome));

  const duplicateNetIncome = structuredClone(makeResponses());
  duplicateNetIncome.incomeStatement.statement.lines.push(
    structuredClone(duplicateNetIncome.incomeStatement.statement.lines.at(-1)),
  );
  assert.throws(() => buildThreeStatementConnectionData(duplicateNetIncome));

  const missingEndingCash = structuredClone(makeResponses());
  missingEndingCash.cashFlowStatement.statement.cashMovement.endingCash = null;
  assert.throws(() => buildThreeStatementConnectionData(missingEndingCash));

  const unsafeUrl = structuredClone(makeResponses());
  unsafeUrl.incomeStatement.statement.sourceUrl = "https://example.com/filing";
  assert.throws(() => buildThreeStatementConnectionData(unsafeUrl));
});

test("Lesson 10 is an Apple-only progressive lesson with truthful boundaries", async () => {
  const readSource = (path) => readFile(new URL(`../src/${path}`, import.meta.url), "utf8");
  const [page, component, catalog, progress, sequence, dataHelper] = await Promise.all([
    readSource("app/learn/company-analysis/three-statements-connect/page.tsx"),
    readSource("components/three-statements-learning.tsx"),
    readSource("lib/lesson-catalog.ts"),
    readSource("lib/learning-progress.ts"),
    readSource("components/lesson-sequence-navigation.tsx"),
    readSource("lib/three-statements-data.ts"),
  ]);

  assert.match(page, /conceptId="three-statements-connect"/);
  assert.match(page, /currently reviewed for Apple FY2025 only/i);
  assert.doesNotMatch(page, /CompanyExampleSelector/);
  assert.match(component, /three statements, three questions/i);
  assert.match(component, /indirect-method operating cash-flow reconciliation/i);
  assert.match(component, /match exactly in this reviewed Apple filing/i);
  assert.match(component, /mean exactly/i);
  assert.match(component, /where would you look for cash at the reporting date/i);
  assert.match(component, /markExplored\(\["three-statements-connect"\]\)/);
  assert.match(component, /EvidenceInspector/);
  assert.doesNotMatch(component, /Revenue\s*→\s*Assets|Net Income\s*→\s*Equity/);
  assert.match(catalog, /number: 10/);
  assert.match(progress, /three-statements-connect/);
  assert.doesNotMatch(sequence, /"three-statements-connect"/);
  assert.match(dataHelper, /Promise\.all/);
  assert.doesNotMatch(`${page}${component}`, /112010000000|111482000000|35934000000/);
});
