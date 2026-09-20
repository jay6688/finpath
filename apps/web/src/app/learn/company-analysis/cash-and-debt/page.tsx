import type { Metadata } from "next";

import { CashDebtLearning } from "@/components/cash-debt-learning";
import { CompanyExampleSelector } from "@/components/company-example-selector";
import { LessonShell } from "@/components/lesson-shell";
import {
  FinPathApiError,
  getCompanyBalanceSheet,
  getSupportedCompanies,
  type CompanyBalanceSheet,
} from "@/lib/api";
import { validateBalanceSheetForLesson } from "@/lib/balance-sheet-learning";
import { resolveCompanyQuery } from "@/lib/company-selection";
import { EvidenceDataError } from "@/lib/evidence";

export const metadata: Metadata = {
  title: "Learn Cash & Debt",
  description: "Separate Cash, Borrowings and Total Liabilities using reviewed company data.",
};
export const dynamic = "force-dynamic";

export default async function CashDebtLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string | string[] }>;
}) {
  const companies = (await getSupportedCompanies()).filter(
    (company) => company.capabilities.cashDebt,
  );
  const selectedCompany = resolveCompanyQuery((await searchParams).company, companies);
  let balanceSheet: CompanyBalanceSheet | null = null;
  let dataError: string | null = null;

  try {
    balanceSheet = await getCompanyBalanceSheet(
      selectedCompany.ticker,
      selectedCompany.reviewedFiscalYear,
    );
    validateBalanceSheetForLesson(balanceSheet.statement, balanceSheet.company);
  } catch (error) {
    balanceSheet = null;
    dataError =
      error instanceof FinPathApiError || error instanceof EvidenceDataError
        ? error.message
        : "The FinPath API is not available. Start FastAPI and try again.";
  }

  const example = balanceSheet
    ? `${selectedCompany.name} · FY${balanceSheet.statement.fiscalYear} · SEC ${balanceSheet.statement.form}`
    : `${selectedCompany.name} · reviewed SEC filing`;

  return (
    <LessonShell
      conceptId="cash-and-debt"
      example={example}
      exampleSelector={
        <CompanyExampleSelector
          companies={companies}
          selectedCompany={selectedCompany}
        />
      }
      selectedCompany={selectedCompany}
    >
      {balanceSheet ? (
        <CashDebtLearning
          balanceSheet={balanceSheet}
          key={`${balanceSheet.company.cik}-${balanceSheet.statement.accession}`}
        />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Reviewed Cash & Debt data is not available yet</strong>
            <p>{dataError}</p>
            <p>FinPath will not substitute another company or an unreviewed SEC fact.</p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
