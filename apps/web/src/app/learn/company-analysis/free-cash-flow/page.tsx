import type { Metadata } from "next";

import { FreeCashFlowLearning } from "@/components/free-cash-flow-learning";
import { LessonShell } from "@/components/lesson-shell";
import lessonContent from "@/content/cash-flow-lessons/aapl-free-cash-flow-fy2025.json";
import {
  FinPathApiError,
  getCompanyCashFlowStatement,
  type CompanyCashFlowStatement,
} from "@/lib/api";
import {
  CashFlowLearningDataError,
  deriveSimpleFreeCashFlow,
  validateCompleteCashFlowStatement,
} from "@/lib/cash-flow-learning";

export const metadata: Metadata = {
  title: "Learn Free Cash Flow",
  description:
    "Derive one simple Free Cash Flow measure from Apple's reported cash-flow inputs.",
};
export const dynamic = "force-dynamic";

export default async function FreeCashFlowPage() {
  let cashFlowStatement: CompanyCashFlowStatement | null = null;
  let derivation = null;
  let dataError: string | null = null;
  try {
    cashFlowStatement = await getCompanyCashFlowStatement(
      lessonContent.ticker,
      lessonContent.fiscalYear,
    );
    validateCompleteCashFlowStatement(cashFlowStatement.statement, {
      fiscalYear: lessonContent.fiscalYear,
      accession: lessonContent.accession,
    });
    derivation = deriveSimpleFreeCashFlow(cashFlowStatement.statement);
  } catch (error) {
    cashFlowStatement = null;
    dataError =
      error instanceof FinPathApiError || error instanceof CashFlowLearningDataError
        ? error.message
        : "The FinPath API is not available. Start FastAPI and try again.";
  }

  return (
    <LessonShell conceptId="free-cash-flow" example="Apple Inc. · FY2025 · SEC 10-K">
      {cashFlowStatement && derivation ? (
        <FreeCashFlowLearning
          cashFlowStatement={cashFlowStatement}
          derivation={derivation}
        />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Free Cash Flow inputs are not available yet</strong>
            <p>{dataError}</p>
            <p>
              FinPath will not substitute a hard-coded result when reported inputs are
              missing or mismatched.
            </p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
