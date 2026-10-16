import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildBalanceSheetPresentation,
  buildBalanceSheetEvidence,
  buildCashDebtPresentation,
  validateBalanceSheetForLesson,
} from "../src/lib/balance-sheet-learning.ts";

const filingUrls = {
  AAPL: "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm",
  MSFT: "https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/0001193125-26-323660-index.htm",
  WMT: "https://www.sec.gov/Archives/edgar/data/104169/000010416926000055/0000104169-26-000055-index.htm",
};

const profiles = {
  AAPL: {
    company: { ticker: "AAPL", name: "Apple Inc.", cik: "0000320193" },
    fiscalYear: 2025,
    asOfDate: "2025-09-27",
    filedAt: "2025-10-31",
    accession: "0000320193-25-000079",
    assets: 359_241_000_000,
    liabilities: 285_508_000_000,
    equity: 73_733_000_000,
    cash: 35_934_000_000,
    equityTag: "StockholdersEquity",
    supplemental: [
      ["current-marketable-securities", "MarketableSecuritiesCurrent", "Current marketable securities", 18_763_000_000],
      ["noncurrent-marketable-securities", "MarketableSecuritiesNoncurrent", "Non-current marketable securities", 77_723_000_000],
    ],
    borrowings: [
      ["commercial-paper", "CommercialPaper", "Commercial paper", 7_979_000_000],
      ["current-term-debt", "LongTermDebtCurrent", "Current term debt", 12_350_000_000],
      ["noncurrent-term-debt", "LongTermDebtNoncurrent", "Non-current term debt", 78_328_000_000],
    ],
  },
  MSFT: {
    company: { ticker: "MSFT", name: "Microsoft Corporation", cik: "0000789019" },
    fiscalYear: 2026,
    asOfDate: "2026-06-30",
    filedAt: "2026-07-29",
    accession: "0001193125-26-323660",
    assets: 758_376_000_000,
    liabilities: 315_989_000_000,
    equity: 442_387_000_000,
    cash: 20_935_000_000,
    equityTag: "StockholdersEquity",
    supplemental: [
      ["short-term-investments", "ShortTermInvestments", "Short-term investments", 55_908_000_000],
    ],
    borrowings: [
      ["current-portion-long-term-debt", "LongTermDebtCurrent", "Current portion of long-term debt", 9_227_000_000],
      ["long-term-debt", "LongTermDebtNoncurrent", "Long-term debt", 31_067_000_000],
    ],
  },
};

const dataStatus = { state: "cached", retrievedAt: "2026-09-18T16:03:40Z" };

function reported(id, taxonomyTag, reportedLabel, value, role) {
  return {
    evidenceKind: "reported",
    id,
    taxonomyTag,
    taxonomyLabel: taxonomyTag,
    reportedLabel,
    value,
    role,
  };
}

function makeDirectBalanceSheet(ticker) {
  const profile = profiles[ticker];
  const borrowingInputs = profile.borrowings.map(([id, tag, label, value]) =>
    reported(id, tag, label, value, "borrowing-component"),
  );
  return {
    company: profile.company,
    dataStatus,
    statement: {
      fiscalYear: profile.fiscalYear,
      asOfDate: profile.asOfDate,
      currency: "USD",
      form: "10-K",
      filedAt: profile.filedAt,
      accession: profile.accession,
      sourceUrl: filingUrls[ticker],
      statementName: ticker === "AAPL" ? "Consolidated Balance Sheets" : "Balance Sheets",
      assets: reported("total-assets", "Assets", "Total assets", profile.assets, "assets"),
      liabilities: reported("total-liabilities", "Liabilities", "Total liabilities", profile.liabilities, "liabilities"),
      otherClaims: [],
      equity: reported("shareholders-equity", profile.equityTag, "Total shareholders’ equity", profile.equity, "equity"),
      cashAndCashEquivalents: reported("cash-and-cash-equivalents", "CashAndCashEquivalentsAtCarryingValue", "Cash and cash equivalents", profile.cash, "supporting-fact"),
      supplementalFinancialAssets: profile.supplemental.map(([id, tag, label, value]) =>
        reported(id, tag, label, value, "supplemental-financial-asset"),
      ),
      simpleBorrowings: {
        evidenceKind: "derived",
        id: "simple-borrowings",
        label: "FinPath simple borrowings",
        value: borrowingInputs.reduce((sum, line) => sum + line.value, 0),
        formula: borrowingInputs.map((line) => line.reportedLabel).join(" + "),
        definition: "The sum of the reviewed borrowing lines used in this lesson.",
        inputs: borrowingInputs,
      },
    },
  };
}

function makeWalmartBalanceSheet() {
  const inputs = [
    reported("current-liabilities", "LiabilitiesCurrent", "Total current liabilities", 107_469_000_000, "liability-component"),
    reported("long-term-debt", "LongTermDebtNoncurrent", "Long-term debt", 34_624_000_000, "liability-component"),
    reported("long-term-operating-lease-obligations", "OperatingLeaseLiabilityNoncurrent", "Long-term operating lease obligations", 13_941_000_000, "liability-component"),
    reported("long-term-finance-lease-obligations", "FinanceLeaseLiabilityNoncurrent", "Long-term finance lease obligations", 5_905_000_000, "liability-component"),
    reported("deferred-income-taxes-and-other", "DeferredIncomeTaxesAndOtherLiabilitiesNoncurrent", "Deferred income taxes and other", 16_549_000_000, "liability-component"),
  ];
  const borrowingInputs = [
    reported("short-term-borrowings", "ShortTermBorrowings", "Short-term borrowings", 6_596_000_000, "borrowing-component"),
    reported("long-term-debt-due-within-one-year", "LongTermDebtCurrent", "Long-term debt due within one year", 3_542_000_000, "borrowing-component"),
    reported("long-term-debt", "LongTermDebtNoncurrent", "Long-term debt", 34_624_000_000, "borrowing-component"),
  ];
  return {
    company: { ticker: "WMT", name: "Walmart Inc.", cik: "0000104169" },
    dataStatus,
    statement: {
      fiscalYear: 2026,
      asOfDate: "2026-01-31",
      currency: "USD",
      form: "10-K",
      filedAt: "2026-03-13",
      accession: "0000104169-26-000055",
      sourceUrl: filingUrls.WMT,
      statementName: "Consolidated Balance Sheets",
      assets: reported("total-assets", "Assets", "Total assets", 284_668_000_000, "assets"),
      liabilities: {
        evidenceKind: "derived",
        id: "total-liabilities",
        label: "Liabilities",
        value: 178_488_000_000,
        role: "liabilities",
        formula: "Total current liabilities + long-term liability lines",
        inputs,
      },
      otherClaims: [reported("redeemable-noncontrolling-interest", "RedeemableNoncontrollingInterestEquityCarryingAmount", "Redeemable noncontrolling interest", 293_000_000, "other-claim")],
      equity: reported("shareholders-equity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest", "Total shareholders’ equity", 105_887_000_000, "equity"),
      cashAndCashEquivalents: reported("cash-and-cash-equivalents", "CashAndCashEquivalentsAtCarryingValue", "Cash and cash equivalents", 10_727_000_000, "supporting-fact"),
      supplementalFinancialAssets: [],
      simpleBorrowings: {
        evidenceKind: "derived",
        id: "simple-borrowings",
        label: "FinPath simple borrowings",
        value: 44_762_000_000,
        formula: borrowingInputs.map((line) => line.reportedLabel).join(" + "),
        definition: "The sum of the reviewed borrowing lines used in this lesson.",
        inputs: borrowingInputs,
      },
    },
  };
}

test("validates exact Apple and Microsoft instant equations", () => {
  for (const ticker of ["AAPL", "MSFT"]) {
    const response = makeDirectBalanceSheet(ticker);
    validateBalanceSheetForLesson(response.statement, response.company);
    assert.equal(
      response.statement.assets.value,
      response.statement.liabilities.value + response.statement.equity.value,
    );
  }
});

test("builds Apple's exact financial-position frame on one Assets reference", () => {
  const presentation = buildBalanceSheetPresentation(makeDirectBalanceSheet("AAPL"));

  assert.deepEqual(presentation.assets, {
    id: "assets",
    amount: 359_241_000_000,
    sourceStatus: "reported",
    sharePercent: 100,
  });
  assert.deepEqual(presentation.claims, [
    {
      id: "liabilities",
      amount: 285_508_000_000,
      sourceStatus: "reported",
      sharePercent: (285_508_000_000 / 359_241_000_000) * 100,
    },
    {
      id: "equity",
      amount: 73_733_000_000,
      sourceStatus: "reported",
      sharePercent: (73_733_000_000 / 359_241_000_000) * 100,
    },
  ]);
  assert.deepEqual(presentation.scale, {
    kind: "assets-reference",
    referenceAmount: 359_241_000_000,
  });
  assert.equal(presentation.asOfDate, "2025-09-27");
  assert.equal(presentation.claimsTotal, 359_241_000_000);
  assert.ok(
    Math.abs(
      presentation.claims.reduce((sum, claim) => sum + claim.sharePercent, 0) - 100,
    ) < Number.EPSILON * 100,
  );
});

test("builds Apple's Cash & Debt comparison on one shared balance scale", () => {
  const presentation = buildCashDebtPresentation(makeDirectBalanceSheet("AAPL"));
  const total = 35_934_000_000 + 18_763_000_000 + 77_723_000_000;

  assert.equal(total, 132_420_000_000);
  assert.deepEqual(presentation.cashPosition, {
    kind: "reported-balance-sheet-position",
    label: "Cash and cash equivalents",
    amount: 35_934_000_000,
    magnitudePercent: (35_934_000_000 / total) * 100,
  });
  assert.deepEqual(presentation.securityPositions, [
    {
      kind: "reported-balance-sheet-position",
      id: "current-marketable-securities",
      label: "Current marketable securities",
      horizon: "current",
      amount: 18_763_000_000,
      magnitudePercent: (18_763_000_000 / total) * 100,
    },
    {
      kind: "reported-balance-sheet-position",
      id: "noncurrent-marketable-securities",
      label: "Non-current marketable securities",
      horizon: "non-current",
      amount: 77_723_000_000,
      magnitudePercent: (77_723_000_000 / total) * 100,
    },
  ]);
  assert.deepEqual(presentation.cashAndSecuritiesPosition, {
    kind: "finpath-derived-balance-sheet-position",
    label: "FinPath cash and securities total",
    amount: total,
    magnitudePercent: 100,
    componentIds: [
      "cash-and-cash-equivalents",
      "current-marketable-securities",
      "noncurrent-marketable-securities",
    ],
    includesNoncurrent: true,
  });
  assert.deepEqual(presentation.borrowingPosition, {
    kind: "finpath-derived-balance-sheet-position",
    label: "FinPath simple borrowings",
    amount: 98_657_000_000,
    magnitudePercent: (98_657_000_000 / total) * 100,
    componentIds: ["commercial-paper", "current-term-debt", "noncurrent-term-debt"],
  });
  // The shared scale must include the new total, not only cash and borrowings.
  assert.deepEqual(presentation.scale, {
    kind: "shared-absolute-balance-scale",
    referenceAmount: total,
  });
  assert.equal(presentation.asOfDate, "2025-09-27");
  assert.equal("netDebt" in presentation, false);
});

test("adds Microsoft short-term investments as a current-only securities total", () => {
  const presentation = buildCashDebtPresentation(makeDirectBalanceSheet("MSFT"));
  const total = 20_935_000_000 + 55_908_000_000;

  assert.deepEqual(
    presentation.securityPositions.map(({ id, horizon, amount }) => [id, horizon, amount]),
    [["short-term-investments", "current", 55_908_000_000]],
  );
  assert.equal(presentation.cashAndSecuritiesPosition.amount, total);
  assert.equal(presentation.cashAndSecuritiesPosition.includesNoncurrent, false);
  assert.equal(presentation.scale.referenceAmount, total);
  assert.equal(presentation.borrowingPosition.amount, 40_294_000_000);
});

test("counts only Walmart cash when no securities line is reviewed", () => {
  const presentation = buildCashDebtPresentation(makeWalmartBalanceSheet());
  const evidence = buildBalanceSheetEvidence(makeWalmartBalanceSheet());

  assert.deepEqual(presentation.securityPositions, []);
  // No zero-value securities total: the absent line stays absent.
  assert.equal(presentation.cashAndSecuritiesPosition, null);
  assert.equal(evidence.cashAndSecurities, null);
  assert.equal(presentation.cashPosition.amount, 10_727_000_000);
  assert.equal(presentation.scale.referenceAmount, 44_762_000_000);
});

test("builds traceable derived evidence for the cash and securities total", () => {
  const evidence = buildBalanceSheetEvidence(makeDirectBalanceSheet("AAPL"));
  const total = evidence.cashAndSecurities;

  assert.equal(total.kind, "derived");
  assert.equal(total.metric.id, "cash-and-securities");
  assert.equal(total.calculation.type, "sum-amount");
  assert.equal(total.calculation.exactResult, 132_420_000_000);
  assert.equal(
    total.calculation.formula,
    "Cash and cash equivalents + Current marketable securities + Non-current marketable securities",
  );
  assert.deepEqual(
    total.inputs.map((input) => [input.kind, input.metric.id, input.reportedFact.taxonomyTag]),
    [
      ["reported", "cash-and-cash-equivalents", "CashAndCashEquivalentsAtCarryingValue"],
      ["reported", "current-marketable-securities", "MarketableSecuritiesCurrent"],
      ["reported", "noncurrent-marketable-securities", "MarketableSecuritiesNoncurrent"],
    ],
  );
  assert.match(total.limitation, /not a company-reported total/);
  assert.match(total.limitation, /does not expect to turn into cash within a year/);

  const microsoft = buildBalanceSheetEvidence(makeDirectBalanceSheet("MSFT")).cashAndSecurities;
  assert.equal(microsoft.calculation.exactResult, 76_843_000_000);
  assert.doesNotMatch(microsoft.limitation, /non-current/);
});

test("refuses to add a supplemental line that is not a reviewed securities line", () => {
  const response = makeDirectBalanceSheet("MSFT");
  response.statement.supplementalFinancialAssets[0].id = "other-financial-asset";
  assert.throws(() => buildCashDebtPresentation(response));
});

test("keeps Walmart liabilities derived and redeemable NCI separate", () => {
  const response = makeWalmartBalanceSheet();
  validateBalanceSheetForLesson(response.statement, response.company);
  const evidence = buildBalanceSheetEvidence(response);

  assert.equal(response.statement.liabilities.evidenceKind, "derived");
  assert.equal(
    response.statement.liabilities.value,
    response.statement.liabilities.inputs.reduce((sum, line) => sum + line.value, 0),
  );
  assert.equal(response.statement.otherClaims[0].value, 293_000_000);
  assert.equal(evidence.liabilities.kind, "derived");
  assert.equal(evidence.liabilities.calculation.type, "sum-amount");
  assert.equal(evidence.liabilities.inputs.length, 5);
  assert.equal(evidence.assets.filing.reportingContext.kind, "instant");
  assert.equal(evidence.simpleBorrowings.metric.id, "simple-borrowings");
  assert.equal(evidence.simpleBorrowings.inputs.length, 3);
});

test("builds company-specific Cash & Debt evidence from reviewed instant facts", () => {
  const expected = {
    AAPL: { cash: 35_934_000_000, supplemental: 2, inputs: 3, borrowings: 98_657_000_000 },
    MSFT: { cash: 20_935_000_000, supplemental: 1, inputs: 2, borrowings: 40_294_000_000 },
  };

  for (const ticker of ["AAPL", "MSFT"]) {
    const evidence = buildBalanceSheetEvidence(makeDirectBalanceSheet(ticker));
    assert.equal(evidence.cashAndCashEquivalents.reportedFact.value, expected[ticker].cash);
    assert.equal(evidence.supplementalFinancialAssets.length, expected[ticker].supplemental);
    assert.equal(evidence.simpleBorrowings.inputs.length, expected[ticker].inputs);
    assert.equal(evidence.simpleBorrowings.calculation.exactResult, expected[ticker].borrowings);
    assert.equal(evidence.simpleBorrowings.kind, "derived");
    assert.equal(evidence.simpleBorrowings.inputs[0].kind, "reported");
    assert.equal(evidence.simpleBorrowings.inputs[0].filing.reportingContext.kind, "instant");
  }

  const walmart = buildBalanceSheetEvidence(makeWalmartBalanceSheet());
  assert.equal(walmart.supplementalFinancialAssets.length, 0);
  assert.equal(walmart.simpleBorrowings.calculation.exactResult, 44_762_000_000);
  assert.equal(walmart.liabilities.calculation.exactResult, 178_488_000_000);
});

test("rejects incomplete or cross-company Cash & Debt profiles", () => {
  const missing = makeDirectBalanceSheet("AAPL");
  missing.statement.simpleBorrowings.inputs.pop();
  assert.throws(() => validateBalanceSheetForLesson(missing.statement, missing.company));

  const wrongRole = makeDirectBalanceSheet("MSFT");
  wrongRole.statement.supplementalFinancialAssets[0].role = "supporting-fact";
  assert.throws(() => validateBalanceSheetForLesson(wrongRole.statement, wrongRole.company));

  const wrongTotal = makeWalmartBalanceSheet();
  wrongTotal.statement.simpleBorrowings.value += 1;
  assert.throws(() => validateBalanceSheetForLesson(wrongTotal.statement, wrongTotal.company));

  const misleadingFormula = makeDirectBalanceSheet("AAPL");
  misleadingFormula.statement.simpleBorrowings.formula = "Cash minus debt";
  assert.throws(() =>
    validateBalanceSheetForLesson(misleadingFormula.statement, misleadingFormula.company),
  );
});

test("rejects wrong instant identity, unsafe source, missing facts, and bad arithmetic", () => {
  const mutations = [
    (statement) => { statement.asOfDate = "2025-09-26"; },
    (statement) => { statement.sourceUrl = "https://example.com/filing"; },
    (statement) => { statement.assets.value += 1; },
    (statement) => { statement.cashAndCashEquivalents = null; },
  ];

  for (const mutate of mutations) {
    const response = structuredClone(makeDirectBalanceSheet("AAPL"));
    mutate(response.statement);
    assert.throws(() => validateBalanceSheetForLesson(response.statement, response.company));
  }

  const walmart = makeWalmartBalanceSheet();
  walmart.statement.liabilities.inputs[0].value += 1;
  assert.throws(() => validateBalanceSheetForLesson(walmart.statement, walmart.company));

  const swappedCompany = makeDirectBalanceSheet("MSFT");
  swappedCompany.company.cik = "0000320193";
  assert.throws(() =>
    validateBalanceSheetForLesson(swappedCompany.statement, swappedCompany.company),
  );
});

test("Lesson 08 teaches snapshot, exact equation, cash and equity boundaries", async () => {
  const [page, component, styles, catalog, progress, companyPage, snapshot] = await Promise.all([
    readFile(new URL("../src/app/learn/company-analysis/balance-sheet/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/balance-sheet-learning.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/balance-sheet-learning.module.css", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/lesson-catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/learning-progress.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/company/[ticker]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/financial-position-snapshot.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /conceptId="balance-sheet"/);
  assert.match(page, /searchParams/);
  assert.match(page, /CompanyExampleSelector/);
  assert.match(page, /buildBalanceSheetPresentation/);
  assert.match(page, /presentation=\{presentation\}/);
  assert.match(component, /financial position at one\s+reporting\s+date/i);
  assert.match(component, /resources recognized on the Balance Sheet/i);
  assert.match(component, /obligations recognized on the Balance Sheet/i);
  assert.match(component, /residual accounting interest after liabilities/i);
  assert.match(component, /for the year ended/i);
  assert.match(component, /as of/i);
  assert.match(component, /aria-pressed/);
  assert.match(component, /--balance-share/);
  assert.match(styles, /width:\s*calc\(var\(--balance-share\) \* 1%\)/);
  assert.doesNotMatch(styles, /min-inline-size|width:\s*(?:min|max|clamp)\(/);
  assert.doesNotMatch(component, /visibleStage|cash-continue/);
  assert.match(component, /Liabilities are not automatically bad/i);
  assert.match(component, /market capitalization/i);
  assert.match(component, /redeemable noncontrolling interest/i);
  assert.match(component, /markExplored\(\["balance-sheet"\]\)/);
  assert.match(component, /EvidenceInspector/);
  assert.match(catalog, /number: 8/);
  assert.match(progress, /balance-sheet/);
  assert.match(companyPage, /FinancialPositionSnapshot/);
  assert.match(snapshot, /Financial position/);
  assert.match(snapshot, /Understand the Balance Sheet/);
  assert.doesNotMatch(`${page}${component}${companyPage}${snapshot}`, /359241000000|758376000000|284668000000/);
});

test("Balance Sheet anchor selection cannot write progress and completion stays submission-only", async () => {
  const component = await readFile(
    new URL("../src/components/balance-sheet-learning.tsx", import.meta.url),
    "utf8",
  );

  assert.match(component, /function review[\s\S]*markExplored\(\["balance-sheet"\]\)/);
  assert.match(component, /onClick=\{\(\) => setSelectedAnchor/);
  assert.doesNotMatch(component, /onClick=\{\(\) =>[^}]*markExplored/);
  assert.match(component, /EvidenceInspector/);
  assert.match(component, /name="balance-sheet-role"/);
});
