import { businessModelProfiles } from "../src/content/business-models/index.ts";
import { makeCompanyCashFlowStatement } from "./cash-flow-fixture.mjs";

export const filingUrl =
  "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm";

export const appleCompany = {
  slug: "aapl",
  ticker: "AAPL",
  name: "Apple Inc.",
  cik: "0000320193",
  reviewedFiscalYear: 2025,
};

const company = {
  ticker: appleCompany.ticker,
  name: appleCompany.name,
  cik: appleCompany.cik,
};
const dataStatus = { state: "cached", retrievedAt: "2026-09-26T00:00:00Z" };

function incomeLine(id, role, value) {
  return {
    id,
    role,
    value,
    taxonomyTag: `fixture-${id}`,
    taxonomyLabel: `Fixture ${id}`,
  };
}

function reported(id, value, role, reportedLabel) {
  return {
    evidenceKind: "reported",
    id,
    taxonomyTag: `fixture-${id}`,
    taxonomyLabel: `Fixture ${id}`,
    reportedLabel,
    value,
    role,
  };
}

export function makeCompanyOverview() {
  const fact = (fiscalYear, startDate, endDate, value, accession) => ({
    fiscalYear,
    startDate,
    endDate,
    value,
    form: "10-K",
    filedAt: fiscalYear === 2025 ? "2025-10-31" : "2024-11-01",
    accession,
    sourceUrl:
      fiscalYear === 2025
        ? filingUrl
        : "https://www.sec.gov/Archives/edgar/data/320193/000032019324000123/0000320193-24-000123-index.htm",
  });
  return {
    company,
    metric: {
      id: "revenue",
      label: "Revenue",
      currency: "USD",
      taxonomyTag: "RevenueFromContractWithCustomerExcludingAssessedTax",
    },
    series: [
      fact(2024, "2023-10-01", "2024-09-28", 391_035_000_000, "0000320193-24-000123"),
      fact(2025, "2024-09-29", "2025-09-27", 416_161_000_000, "0000320193-25-000079"),
    ],
    dataStatus,
  };
}

export function makeIncomeStatement() {
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

export function makeBalanceSheet() {
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
      equity: reported("shareholders-equity", 73_733_000_000, "equity", "Total shareholders' equity"),
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

export function makeEarningsPerShare() {
  const fact = (id, taxonomyTag, reportedLabel, value, unit) => ({
    evidenceKind: "reported",
    id,
    taxonomyTag,
    taxonomyLabel: taxonomyTag,
    reportedLabel,
    value,
    unit,
  });
  const verification = (basis, denominator, result) => ({
    evidenceKind: "verification",
    basis,
    formula: "Earnings numerator ÷ weighted-average shares",
    numerator: 112_010_000_000,
    denominator,
    unroundedResult: result,
    roundedResult: result,
    reportedResult: result,
    decimalPlaces: 2,
    roundingMode: "ROUND_HALF_UP",
    matchesReported: true,
  });
  return {
    company,
    statement: {
      fiscalYear: 2025,
      startDate: "2024-09-29",
      endDate: "2025-09-27",
      currency: "USD",
      form: "10-K",
      filedAt: "2025-10-31",
      accession: "0000320193-25-000079",
      sourceUrl: filingUrl,
      statementName: "Earnings Per Share",
      earningsNumerator: fact("earnings-numerator", "NetIncomeLoss", "Net income", 112_010_000_000, "USD"),
      basicWeightedAverageShares: fact("basic-weighted-average-shares", "WeightedAverageNumberOfSharesOutstandingBasic", "Weighted-average basic shares", 14_948_500_000, "shares"),
      dilutedWeightedAverageShares: fact("diluted-weighted-average-shares", "WeightedAverageNumberOfDilutedSharesOutstanding", "Weighted-average diluted shares", 15_004_697_000, "shares"),
      basicEps: fact("basic-eps", "EarningsPerShareBasic", "Basic earnings per share", "7.49", "USD/share"),
      dilutedEps: fact("diluted-eps", "EarningsPerShareDiluted", "Diluted earnings per share", "7.46", "USD/share"),
      basicVerification: verification("basic", 14_948_500_000, "7.49"),
      dilutedVerification: verification("diluted", 15_004_697_000, "7.46"),
    },
    dataStatus,
  };
}

export function makeSharesOutstanding() {
  return {
    company,
    fact: {
      evidenceKind: "reported",
      id: "common-shares-outstanding",
      fiscalYear: 2025,
      asOfDate: "2025-10-17",
      form: "10-K",
      filedAt: "2025-10-31",
      accession: "0000320193-25-000079",
      sourceUrl: filingUrl,
      taxonomyNamespace: "dei",
      taxonomyTag: "EntityCommonStockSharesOutstanding",
      taxonomyLabel: "Entity Common Stock, Shares Outstanding",
      reportedLabel: "Shares of common stock outstanding",
      value: 14_776_353_000,
      unit: "shares",
    },
    dataStatus,
  };
}

export function makeCapstoneInputs() {
  const cashFlowStatement = makeCompanyCashFlowStatement();
  cashFlowStatement.dataStatus = dataStatus;
  return {
    businessProfile: structuredClone(
      businessModelProfiles.find((profile) => profile.company.ticker === "AAPL"),
    ),
    overview: makeCompanyOverview(),
    incomeStatement: makeIncomeStatement(),
    cashFlowStatement,
    balanceSheet: makeBalanceSheet(),
    earningsPerShare: makeEarningsPerShare(),
    sharesOutstanding: makeSharesOutstanding(),
  };
}
