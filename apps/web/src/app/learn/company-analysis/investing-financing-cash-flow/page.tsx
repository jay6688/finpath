import type { Metadata } from "next";

import { InvestingFinancingCashFlowLearning } from "@/components/investing-financing-cash-flow-learning";
import { LessonShell } from "@/components/lesson-shell";
import lessonContent from "@/content/cash-flow-lessons/aapl-investing-financing-fy2025.json";
import {
  FinPathApiError,
  getCompanyCashFlowStatement,
  type CompanyCashFlowStatement,
} from "@/lib/api";
import {
  CashFlowLearningDataError,
  validateCompleteCashFlowStatement,
} from "@/lib/cash-flow-learning";

export const metadata: Metadata = {
  title: "Learn Investing & Financing Cash Flow",
  description:
    "Connect Apple's Operating, Investing and Financing cash flows to its annual cash change.",
};
export const dynamic = "force-dynamic";

export default async function InvestingFinancingCashFlowPage() {
  let cashFlowStatement: CompanyCashFlowStatement | null = null;
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
  } catch (error) {
    cashFlowStatement = null;
    dataError =
      error instanceof FinPathApiError || error instanceof CashFlowLearningDataError
        ? error.message
        : "The FinPath API is not available. Start FastAPI and try again.";
  }

  return (
    <LessonShell
      conceptId="investing-financing-cash-flow"
      example="Apple Inc. · FY2025 · SEC 10-K"
    >
      {cashFlowStatement ? (
        <InvestingFinancingCashFlowLearning cashFlowStatement={cashFlowStatement} />
      ) : (
        <div className="data-empty-state profit-data-empty" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Complete Cash Flow Statement data is not available yet</strong>
            <p>{dataError}</p>
            <p>
              FinPath will not replace missing or mismatched SEC facts with hard-coded
              values.
            </p>
          </div>
        </div>
      )}
    </LessonShell>
  );
}
