import type { Metadata } from "next";

import { LessonShell } from "@/components/lesson-shell";
import { ProfitMarginLearning } from "@/components/profit-margin-learning";
import marginContent from "@/content/profit-margin-lessons/aapl-profit-margin-fy2025.json";
import {
  FinPathApiError,
  getCompanyIncomeStatement,
  type CompanyIncomeStatement,
} from "@/lib/api";
import {
  buildMarginPresentation,
  deriveNetProfitMargin,
  type MarginPresentation,
  ProfitMarginDataError,
  type NetProfitMarginDerivation,
} from "@/lib/profit-margin";
import {
  ProfitLearningDataError,
  validateProfitStatementForLesson,
} from "@/lib/profit-learning";

export const metadata: Metadata = {
  title: "Learn Net Profit Margin",
  description: "Compare Apple's Net Income with Revenue using a $100 Revenue model.",
};

export const dynamic = "force-dynamic";

export default async function NetProfitMarginLessonPage() {
  let incomeStatement: CompanyIncomeStatement | null = null;
  let derivation: NetProfitMarginDerivation | null = null;
  let presentation: MarginPresentation | null = null;
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
    presentation = buildMarginPresentation(derivation);
  } catch (error) {
    incomeStatement = null;
    derivation = null;
    presentation = null;
    dataError =
      error instanceof FinPathApiError ||
      error instanceof ProfitLearningDataError ||
      error instanceof ProfitMarginDataError
        ? error.message
        : "The FinPath API is not available. Start FastAPI and try again.";
  }

  return (
    <LessonShell
      conceptId="net-profit-margin"
      example="Apple Inc. · FY2025 · SEC 10-K"
    >
      {incomeStatement && derivation && presentation ? (
        <ProfitMarginLearning
          derivation={derivation}
          incomeStatement={incomeStatement}
          presentation={presentation}
        />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Profit Margin data is not available yet</strong>
            <p>{dataError}</p>
            <p>FinPath will not replace missing or mismatched SEC facts with a hard-coded percentage.</p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
