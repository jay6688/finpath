import {
  getCompanyBalanceSheet,
  getCompanyCashFlowStatement,
  getCompanyIncomeStatement,
  type SupportedCompany,
} from "./api";
import {
  buildThreeStatementConnectionData,
  ThreeStatementDataError,
  type ThreeStatementConnectionData,
} from "./three-statements";

export async function getThreeStatementConnectionData(
  company: SupportedCompany,
): Promise<ThreeStatementConnectionData> {
  if (!company.capabilities.threeStatements) {
    throw new ThreeStatementDataError(
      `${company.name} does not yet have all three reviewed statements for this lesson.`,
    );
  }

  const [incomeStatement, cashFlowStatement, balanceSheet] = await Promise.all([
    getCompanyIncomeStatement(company.ticker, company.reviewedFiscalYear),
    getCompanyCashFlowStatement(company.ticker, company.reviewedFiscalYear),
    getCompanyBalanceSheet(company.ticker, company.reviewedFiscalYear),
  ]);

  return buildThreeStatementConnectionData({
    incomeStatement,
    cashFlowStatement,
    balanceSheet,
  });
}
