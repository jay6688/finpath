export const filingUrl =
  "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm";

const sectionValues = {
  operating: [
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
  ],
  investing: [
    ["purchases-of-marketable-securities", "cash-outflow", -24_407_000_000],
    ["maturities-of-marketable-securities", "cash-inflow", 40_907_000_000],
    ["sales-of-marketable-securities", "cash-inflow", 12_890_000_000],
    ["payments-for-property-plant-and-equipment", "cash-outflow", -12_715_000_000],
    ["other-investing-activities", "cash-outflow", -1_480_000_000],
    ["cash-generated-by-investing-activities", "section-total", 15_195_000_000],
  ],
  financing: [
    ["taxes-related-to-net-share-settlement", "cash-outflow", -5_960_000_000],
    ["dividends-and-dividend-equivalents", "cash-outflow", -15_421_000_000],
    ["common-stock-repurchases", "cash-outflow", -90_711_000_000],
    ["term-debt-issuance-net", "cash-inflow", 4_481_000_000],
    ["term-debt-repayment", "cash-outflow", -10_932_000_000],
    ["commercial-paper-net", "signed-cash-flow", -2_032_000_000],
    ["other-financing-activities", "signed-cash-flow", -111_000_000],
    ["cash-used-in-financing-activities", "section-total", -120_686_000_000],
  ],
};

function makeLine([id, role, value]) {
  return {
    id,
    role,
    value,
    taxonomyTag: `fixture-${id}`,
    taxonomyLabel: `Fixture ${id}`,
  };
}

export function makeCashFlowStatement() {
  return {
    fiscalYear: 2025,
    startDate: "2024-09-29",
    endDate: "2025-09-27",
    currency: "USD",
    form: "10-K",
    filedAt: "2025-10-31",
    accession: "0000320193-25-000079",
    sourceUrl: filingUrl,
    sections: Object.entries(sectionValues).map(([id, lines]) => ({
      id,
      lines: lines.map(makeLine),
    })),
    cashMovement: {
      beginningCash: {
        id: "beginning-cash",
        taxonomyTag: "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
        taxonomyLabel: "Cash, Cash Equivalents, Restricted Cash and Restricted Cash Equivalents",
        value: 29_943_000_000,
        asOfDate: "2024-09-28",
      },
      netChange: makeLine(["net-change-in-cash", "cash-change", 5_991_000_000]),
      endingCash: {
        id: "ending-cash",
        taxonomyTag: "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
        taxonomyLabel: "Cash, Cash Equivalents, Restricted Cash and Restricted Cash Equivalents",
        value: 35_934_000_000,
        asOfDate: "2025-09-27",
      },
    },
  };
}

export function makeCompanyCashFlowStatement() {
  return {
    company: { ticker: "AAPL", name: "Apple Inc.", cik: "0000320193" },
    statement: makeCashFlowStatement(),
    dataStatus: { state: "live", retrievedAt: "2026-09-17T00:00:00Z" },
  };
}
