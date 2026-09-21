import type {
  CashFlowStatementLine,
  CompanyBalanceSheet,
  CompanyCashFlowStatement,
  CompanyIncomeStatement,
} from "./api.ts";
import { validateBalanceSheetForLesson } from "./balance-sheet-learning.ts";
import { validateCompleteCashFlowStatement } from "./cash-flow-learning.ts";
import {
  buildReportedEvidence,
  reportedFactFromStatementLine,
  type ReportedEvidence,
  type ReportingContext,
} from "./evidence.ts";
import { validateProfitStatementForLesson } from "./profit-learning.ts";

export class ThreeStatementDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ThreeStatementDataError";
  }
}

export type ThreeStatementResponses = {
  incomeStatement: CompanyIncomeStatement;
  cashFlowStatement: CompanyCashFlowStatement;
  balanceSheet: CompanyBalanceSheet;
};

type StatementReference = {
  statement: "income-statement" | "cash-flow-statement" | "balance-sheet";
  label: string;
  reportingContext: ReportingContext;
  evidence: ReportedEvidence;
};

export type StatementConnection = {
  id: "net-income-bridge" | "ending-cash-bridge";
  relationship: "same-reported-result" | "period-end-to-reporting-position";
  status: "exact-match";
  source: StatementReference;
  target: StatementReference;
  boundary: string;
};

export type ThreeStatementConnectionData = {
  company: CompanyIncomeStatement["company"];
  filing: {
    fiscalYear: number;
    startDate: string;
    endDate: string;
    asOfDate: string;
    form: "10-K" | "10-K/A";
    filedAt: string;
    accession: string;
    sourceUrl: string;
  };
  values: {
    netIncome: number;
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netChangeInCash: number;
    beginningCash: number;
    endingCash: number;
  };
  connections: StatementConnection[];
  evidence: {
    operatingCashFlow: ReportedEvidence;
    investingCashFlow: ReportedEvidence;
    financingCashFlow: ReportedEvidence;
    netChangeInCash: ReportedEvidence;
    beginningCash: ReportedEvidence;
  };
  dataStatuses: ThreeStatementResponses[keyof ThreeStatementResponses]["dataStatus"][];
};

export function buildThreeStatementConnectionData(
  responses: ThreeStatementResponses,
): ThreeStatementConnectionData {
  try {
    return buildValidatedData(responses);
  } catch (error) {
    if (error instanceof ThreeStatementDataError) throw error;
    throw new ThreeStatementDataError(
      error instanceof Error
        ? error.message
        : "The three statements could not be validated together.",
    );
  }
}

function buildValidatedData({
  incomeStatement,
  cashFlowStatement,
  balanceSheet,
}: ThreeStatementResponses): ThreeStatementConnectionData {
  const income = incomeStatement.statement;
  const cashFlow = cashFlowStatement.statement;
  const balance = balanceSheet.statement;
  const expected = {
    fiscalYear: income.fiscalYear,
    accession: income.accession,
  };

  validateProfitStatementForLesson(income, expected);
  validateCompleteCashFlowStatement(cashFlow, expected);
  validateBalanceSheetForLesson(balance, balanceSheet.company);

  const identities = [
    incomeStatement.company,
    cashFlowStatement.company,
    balanceSheet.company,
  ];
  if (
    identities.some(
      (identity) =>
        identity.ticker !== identities[0].ticker ||
        identity.cik !== identities[0].cik ||
        identity.name !== identities[0].name,
    )
  ) {
    throw new ThreeStatementDataError(
      "The three statements must belong to the same reviewed company.",
    );
  }

  const filingFields = [
    [income.fiscalYear, income.form, income.filedAt, income.accession, income.sourceUrl],
    [cashFlow.fiscalYear, cashFlow.form, cashFlow.filedAt, cashFlow.accession, cashFlow.sourceUrl],
    [balance.fiscalYear, balance.form, balance.filedAt, balance.accession, balance.sourceUrl],
  ];
  if (
    filingFields.some(
      (fields) => fields.some((field, index) => field !== filingFields[0][index]),
    ) ||
    !isCanonicalSecFilingIndexUrl(
      income.sourceUrl,
      income.accession,
      incomeStatement.company.cik,
    )
  ) {
    throw new ThreeStatementDataError(
      "The three statements must share one exact official SEC filing identity.",
    );
  }

  if (
    income.startDate !== cashFlow.startDate ||
    income.endDate !== cashFlow.endDate ||
    cashFlow.endDate !== balance.asOfDate
  ) {
    throw new ThreeStatementDataError(
      "The statement duration and reporting-date contexts do not connect safely.",
    );
  }

  const incomeNetIncome = uniqueIncomeLine(income, "net-income");
  const cashNetIncome = uniqueCashFlowLine(cashFlow, "net-income");
  if (incomeNetIncome.value !== cashNetIncome.value) {
    throw new ThreeStatementDataError(
      "Net Income does not match exactly across the Income Statement and Cash Flow Statement.",
    );
  }

  const operatingCashFlow = uniqueCashFlowLine(
    cashFlow,
    "cash-generated-by-operating-activities",
  );
  const investingCashFlow = uniqueCashFlowLine(
    cashFlow,
    "cash-generated-by-investing-activities",
  );
  const financingCashFlow = uniqueCashFlowLine(
    cashFlow,
    "cash-used-in-financing-activities",
  );
  const movement = cashFlow.cashMovement;
  if (
    !movement?.beginningCash ||
    !movement?.netChange ||
    !movement?.endingCash ||
    movement.endingCash.asOfDate !== cashFlow.endDate ||
    movement.endingCash.asOfDate !== balance.asOfDate
  ) {
    throw new ThreeStatementDataError(
      "Ending cash must use the Cash Flow Statement end date and Balance Sheet reporting date.",
    );
  }
  if (
    movement.endingCash.value !== balance.cashAndCashEquivalents.value
  ) {
    throw new ThreeStatementDataError(
      "Ending cash does not match the reviewed Balance Sheet cash fact exactly.",
    );
  }

  const incomeNetIncomeEvidence = durationEvidence(
    incomeStatement,
    "net-income",
    "Net Income",
  );
  const cashNetIncomeEvidence = durationEvidence(
    cashFlowStatement,
    "net-income",
    "Net Income",
  );
  const operatingCashEvidence = durationEvidence(
    cashFlowStatement,
    "cash-generated-by-operating-activities",
    "Operating Cash Flow",
  );
  const investingCashEvidence = durationEvidence(
    cashFlowStatement,
    "cash-generated-by-investing-activities",
    "Investing Cash Flow",
  );
  const financingCashEvidence = durationEvidence(
    cashFlowStatement,
    "cash-used-in-financing-activities",
    "Financing Cash Flow",
  );
  const netChangeEvidence = durationEvidence(
    cashFlowStatement,
    "net-change-in-cash",
    "Net change in cash",
  );
  const beginningCashEvidence = cashBalanceEvidence(
    cashFlowStatement,
    movement.beginningCash,
    "beginning-cash",
    "Beginning cash",
  );
  const endingCashEvidence = cashBalanceEvidence(
    cashFlowStatement,
    movement.endingCash,
    "ending-cash",
    "Ending cash",
  );
  const balanceCashEvidence = buildReportedEvidence({
    metric: { id: "cash-and-cash-equivalents", label: "Cash and cash equivalents" },
    company: balanceSheet.company,
    currency: balance.currency,
    fact: {
      fiscalYear: balance.fiscalYear,
      asOfDate: balance.asOfDate,
      value: balance.cashAndCashEquivalents.value,
      form: balance.form,
      filedAt: balance.filedAt,
      accession: balance.accession,
      sourceUrl: balance.sourceUrl,
      taxonomyTag: balance.cashAndCashEquivalents.taxonomyTag,
    },
    dataStatus: balanceSheet.dataStatus,
  });

  return {
    company: identities[0],
    filing: {
      fiscalYear: income.fiscalYear,
      startDate: income.startDate,
      endDate: income.endDate,
      asOfDate: balance.asOfDate,
      form: income.form,
      filedAt: income.filedAt,
      accession: income.accession,
      sourceUrl: income.sourceUrl,
    },
    values: {
      netIncome: incomeNetIncome.value,
      operatingCashFlow: operatingCashFlow.value,
      investingCashFlow: investingCashFlow.value,
      financingCashFlow: financingCashFlow.value,
      netChangeInCash: movement.netChange.value,
      beginningCash: movement.beginningCash.value,
      endingCash: movement.endingCash.value,
    },
    connections: [
      {
        id: "net-income-bridge",
        relationship: "same-reported-result",
        status: "exact-match",
        source: {
          statement: "income-statement",
          label: "Net Income",
          reportingContext: incomeNetIncomeEvidence.filing.reportingContext,
          evidence: incomeNetIncomeEvidence,
        },
        target: {
          statement: "cash-flow-statement",
          label: "Net Income",
          reportingContext: cashNetIncomeEvidence.filing.reportingContext,
          evidence: cashNetIncomeEvidence,
        },
        boundary:
          "Apple's indirect-method operating cash-flow reconciliation starts from the same Net Income. Net Income is not cash.",
      },
      {
        id: "ending-cash-bridge",
        relationship: "period-end-to-reporting-position",
        status: "exact-match",
        source: {
          statement: "cash-flow-statement",
          label: "Ending cash",
          reportingContext: endingCashEvidence.filing.reportingContext,
          evidence: endingCashEvidence,
        },
        target: {
          statement: "balance-sheet",
          label: "Cash and cash equivalents",
          reportingContext: balanceCashEvidence.filing.reportingContext,
          evidence: balanceCashEvidence,
        },
        boundary:
          "These values match exactly in this reviewed Apple filing. FinPath does not assume every filing uses one universal cash taxonomy presentation.",
      },
    ],
    evidence: {
      operatingCashFlow: operatingCashEvidence,
      investingCashFlow: investingCashEvidence,
      financingCashFlow: financingCashEvidence,
      netChangeInCash: netChangeEvidence,
      beginningCash: beginningCashEvidence,
    },
    dataStatuses: [
      incomeStatement.dataStatus,
      cashFlowStatement.dataStatus,
      balanceSheet.dataStatus,
    ],
  };
}

function uniqueIncomeLine(
  statement: CompanyIncomeStatement["statement"],
  lineId: "net-income",
) {
  const matches = statement.lines.filter((line) => line.id === lineId);
  if (matches.length !== 1) {
    throw new ThreeStatementDataError(`Expected exactly one ${lineId} line.`);
  }
  return matches[0];
}

function uniqueCashFlowLine(
  statement: CompanyCashFlowStatement["statement"],
  lineId: CashFlowStatementLine["id"],
) {
  const lines = [
    ...statement.sections.flatMap((section) => section.lines),
    statement.cashMovement?.netChange,
  ].filter((line): line is CashFlowStatementLine => Boolean(line));
  const matches = lines.filter((line) => line.id === lineId);
  if (matches.length !== 1) {
    throw new ThreeStatementDataError(`Expected exactly one ${lineId} line.`);
  }
  return matches[0];
}

function durationEvidence(
  response: CompanyIncomeStatement | CompanyCashFlowStatement,
  lineId:
    | "net-income"
    | "cash-generated-by-operating-activities"
    | "cash-generated-by-investing-activities"
    | "cash-used-in-financing-activities"
    | "net-change-in-cash",
  label: string,
): ReportedEvidence {
  const metricIds = {
    "net-income": "net-income",
    "cash-generated-by-operating-activities": "operating-cash-flow",
    "cash-generated-by-investing-activities": "investing-cash-flow",
    "cash-used-in-financing-activities": "financing-cash-flow",
    "net-change-in-cash": "net-change-in-cash",
  } as const;
  return buildReportedEvidence({
    metric: { id: metricIds[lineId], label },
    company: response.company,
    currency: response.statement.currency,
    fact: reportedFactFromStatementLine(response.statement, lineId),
    dataStatus: response.dataStatus,
  });
}

function cashBalanceEvidence(
  response: CompanyCashFlowStatement,
  fact: CompanyCashFlowStatement["statement"]["cashMovement"]["endingCash"],
  metricId: "beginning-cash" | "ending-cash",
  label: string,
): ReportedEvidence {
  const statement = response.statement;
  return buildReportedEvidence({
    metric: { id: metricId, label },
    company: response.company,
    currency: statement.currency,
    fact: {
      fiscalYear: statement.fiscalYear,
      asOfDate: fact.asOfDate,
      value: fact.value,
      form: statement.form,
      filedAt: statement.filedAt,
      accession: statement.accession,
      sourceUrl: statement.sourceUrl,
      taxonomyTag: fact.taxonomyTag,
    },
    dataStatus: response.dataStatus,
  });
}

function isCanonicalSecFilingIndexUrl(
  sourceUrl: string,
  accession: string,
  cik: string,
): boolean {
  try {
    const parsed = new URL(sourceUrl);
    const accessionDirectory = accession.replaceAll("-", "");
    const cikDirectory = cik.replace(/^0+/, "");
    return (
      parsed.protocol === "https:" &&
      ["sec.gov", "www.sec.gov"].includes(parsed.hostname.toLowerCase()) &&
      parsed.port === "" &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      parsed.pathname ===
        `/Archives/edgar/data/${cikDirectory}/${accessionDirectory}/${accession}-index.htm`
    );
  } catch {
    return false;
  }
}
