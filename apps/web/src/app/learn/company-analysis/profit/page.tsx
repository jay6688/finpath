import type { Metadata } from "next";

import { LessonShell } from "@/components/lesson-shell";
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
  title: "Learn Profit and Net Income",
  description: "Follow Apple's reported income-statement lines from Revenue to Net Income.",
};

export const dynamic = "force-dynamic";

export default async function ProfitLessonPage() {
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
    dataError =
      error instanceof FinPathApiError || error instanceof ProfitLearningDataError
        ? error.message
        : "The FinPath API is not available. Start FastAPI and try again.";
  }

  return (
    <LessonShell conceptId="profit" example="Apple Inc. · FY2025 · SEC 10-K">
      {incomeStatement ? (
        <ProfitLearningJourney incomeStatement={incomeStatement} />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Profit statement data is not available yet</strong>
            <p>{dataError}</p>
            <p>FinPath will not replace missing or mismatched SEC facts with hard-coded values.</p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
