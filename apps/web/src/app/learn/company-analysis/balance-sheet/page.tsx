import type { Metadata } from "next";

import { BalanceSheetLearning } from "@/components/balance-sheet-learning";
import { CompanyExampleSelector } from "@/components/company-example-selector";
import { LessonShell } from "@/components/lesson-shell";
import {
  FinPathApiError,
  getCompanyBalanceSheet,
  getSupportedCompanies,
  type CompanyBalanceSheet,
} from "@/lib/api";
import {
  EvidenceDataError,
} from "@/lib/evidence";
import {
  validateBalanceSheetForLesson,
} from "@/lib/balance-sheet-learning";
import { resolveCompanyQuery } from "@/lib/company-selection";

export const metadata: Metadata = {
  title: "Learn the Balance Sheet",
  description: "Read Assets, Liabilities and Equity as a snapshot at one reporting date.",
};
export const dynamic = "force-dynamic";

export default async function BalanceSheetLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string | string[] }>;
}) {
  const companies = (await getSupportedCompanies()).filter(
    (company) => company.capabilities.balanceSheet,
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
      conceptId="balance-sheet"
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
        <BalanceSheetLearning balanceSheet={balanceSheet} />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Reviewed Balance Sheet data is not available yet</strong>
            <p>{dataError}</p>
            <p>
              FinPath will not substitute another company or an unreviewed SEC fact.
            </p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
