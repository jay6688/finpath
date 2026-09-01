import type { Metadata } from "next";
import Link from "next/link";

import { ProfitMarginLearning } from "@/components/profit-margin-learning";
import marginContent from "@/content/profit-margin-lessons/aapl-profit-margin-fy2025.json";
import {
  FinPathApiError,
  getCompanyIncomeStatement,
  type CompanyIncomeStatement,
} from "@/lib/api";
import {
  deriveNetProfitMargin,
  ProfitMarginDataError,
  type NetProfitMarginDerivation,
} from "@/lib/profit-margin";
import {
  ProfitLearningDataError,
  validateProfitStatementForLesson,
} from "@/lib/profit-learning";


export const metadata: Metadata = {
  title: "Apple Net Profit Margin",
  description:
    "Compare Apple's FY2025 Net Income with Revenue on a beginner-friendly $100 scale.",
};

export const dynamic = "force-dynamic";

export default async function AppleProfitMarginPage() {
  let incomeStatement: CompanyIncomeStatement | null = null;
  let derivation: NetProfitMarginDerivation | null = null;
  let dataError: string | null = null;

  try {
    incomeStatement = await getCompanyIncomeStatement(
      marginContent.ticker,
      marginContent.fiscalYear,
    );
    validateProfitStatementForLesson(incomeStatement.statement, {
      fiscalYear: marginContent.fiscalYear,
      accession: marginContent.accession,
    });
    derivation = deriveNetProfitMargin(incomeStatement.statement);
  } catch (error) {
    incomeStatement = null;
    derivation = null;
    if (
      error instanceof FinPathApiError ||
      error instanceof ProfitLearningDataError ||
      error instanceof ProfitMarginDataError
    ) {
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
        <Link href="/company/aapl/profit">Profit</Link>
        <span aria-hidden="true">/</span>
        <strong>Net Profit Margin</strong>
      </nav>

      <header className="company-header profit-company-header">
        <div>
          <p className="eyebrow">Company research</p>
          <h1>{incomeStatement?.company.name ?? "Apple Inc."}</h1>
          <p className="company-header__meta">
            AAPL · Nasdaq · SEC CIK {incomeStatement?.company.cik ?? "0000320193"}
          </p>
        </div>
      </header>

      {incomeStatement && derivation ? (
        <ProfitMarginLearning
          derivation={derivation}
          incomeStatement={incomeStatement}
        />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Profit Margin data is not available yet</strong>
            <p>{dataError}</p>
            <p>
              FinPath will not replace missing or mismatched SEC facts with a
              hard-coded percentage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
