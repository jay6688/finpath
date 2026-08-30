import type { Metadata } from "next";
import Link from "next/link";

import { ProfitLearningJourney } from "@/components/profit-learning-journey";
import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import {
  FinPathApiError,
  getCompanyIncomeStatement,
  type CompanyIncomeStatement,
} from "@/lib/api";
import {
  ProfitLearningDataError,
  validateProfitStatementForLesson,
} from "@/lib/profit-learning";


export const metadata: Metadata = {
  title: "Apple Profit",
  description:
    "Follow Apple's FY2025 reported income-statement lines from Revenue to Net Income.",
};

export const dynamic = "force-dynamic";

export default async function AppleProfitPage() {
  let incomeStatement: CompanyIncomeStatement | null = null;
  let dataError: string | null = null;

  try {
    incomeStatement = await getCompanyIncomeStatement(
      profitContent.ticker,
      profitContent.fiscalYear,
    );
    validateProfitStatementForLesson(incomeStatement.statement, {
      fiscalYear: profitContent.fiscalYear,
      accession: profitContent.accession,
    });
  } catch (error) {
    incomeStatement = null;
    if (error instanceof FinPathApiError) {
      dataError = error.message;
    } else if (error instanceof ProfitLearningDataError) {
      dataError = error.message;
    } else {
      dataError = "The FinPath API is not available. Start FastAPI and try again.";
    }
  }

  return (
    <div className="company-shell profit-page-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Explore</span>
        <span aria-hidden="true">/</span>
        <Link href="/company/aapl">Apple Inc.</Link>
        <span aria-hidden="true">/</span>
        <strong>Profit</strong>
      </nav>

      <header className="company-header profit-company-header">
        <div>
          <p className="eyebrow">Company research</p>
          <h1>{incomeStatement?.company.name ?? "Apple Inc."}</h1>
          <p className="company-header__meta">
            AAPL · Nasdaq · SEC CIK{" "}
            {incomeStatement?.company.cik ?? "0000320193"}
          </p>
        </div>
        {incomeStatement ? (
          <span className="source-connected">SEC source connected</span>
        ) : null}
      </header>

      {incomeStatement ? (
        <ProfitLearningJourney incomeStatement={incomeStatement} />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Profit statement data is not available yet</strong>
            <p>{dataError}</p>
            <p>
              FinPath will not replace missing or mismatched SEC facts with
              hard-coded financial values.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
