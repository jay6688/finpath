import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import {
  FinPathApiError,
  getCompanyIncomeStatement,
  getCompanyOverview,
  type AnnualFinancialFact,
  type CompanyIncomeStatement,
  type CompanyOverview,
  type IncomeStatementLineId,
} from "@/lib/api";
import {
  buildReportedEvidence,
  buildReviewedPresentation,
  type ReportedEvidence,
  type ReviewedPresentation,
} from "@/lib/evidence";
import { orderRevenueSeries } from "@/lib/history-insight";
import { validateProfitStatementForLesson } from "@/lib/profit-learning";

export type AppleRevenueData = {
  dataError: string | null;
  latest: AnnualFinancialFact | null;
  overview: CompanyOverview | null;
  revenueEvidence: ReportedEvidence | null;
  reviewedRevenue: ReviewedPresentation | null;
};

const reviewedLabels = Object.fromEntries(
  Object.entries(profitContent.lines).map(([id, line]) => [id, line.reportedLabel]),
) as Partial<Record<IncomeStatementLineId, string>>;

export async function getAppleRevenueData(): Promise<AppleRevenueData> {
  let overview: CompanyOverview | null = null;
  let incomeStatement: CompanyIncomeStatement | null = null;
  let dataError: string | null = null;

  const [overviewResult, statementResult] = await Promise.allSettled([
    getCompanyOverview("AAPL"),
    getCompanyIncomeStatement(profitContent.ticker, profitContent.fiscalYear),
  ]);

  if (overviewResult.status === "fulfilled") {
    overview = {
      ...overviewResult.value,
      series: orderRevenueSeries(overviewResult.value.series),
    };
  } else {
    dataError =
      overviewResult.reason instanceof FinPathApiError
        ? overviewResult.reason.message
        : "The FinPath API is not available. Start FastAPI and try again.";
  }

  if (statementResult.status === "fulfilled") {
    try {
      validateProfitStatementForLesson(statementResult.value.statement, {
        fiscalYear: profitContent.fiscalYear,
        accession: profitContent.accession,
      });
      incomeStatement = statementResult.value;
    } catch {
      // Revenue remains usable; reviewed statement context must degrade quietly.
    }
  }

  const latest = overview?.series.at(-1) ?? null;
  let reviewedRevenue: ReviewedPresentation | null = null;
  let revenueEvidence: ReportedEvidence | null = null;

  if (incomeStatement) {
    reviewedRevenue = buildReviewedPresentation({
      statement: incomeStatement.statement,
      content: {
        fiscalYear: profitContent.fiscalYear,
        startDate: profitContent.startDate,
        endDate: profitContent.endDate,
        form: profitContent.form as "10-K" | "10-K/A",
        filedAt: profitContent.filedAt,
        accession: profitContent.accession,
        statementName: profitContent.verification.statementName,
        labels: reviewedLabels,
      },
      lineId: "total-net-sales",
      contextLineIds: ["total-net-sales", "total-cost-of-sales", "gross-margin"],
    });
  }

  if (overview && latest) {
    try {
      revenueEvidence = buildReportedEvidence({
        metric: { id: "revenue", label: "Revenue" },
        company: overview.company,
        currency: overview.metric.currency,
        taxonomyTag: overview.metric.taxonomyTag,
        fact: latest,
        dataStatus: overview.dataStatus,
        reviewedPresentation: reviewedRevenue,
      });
    } catch {
      // The number remains visible; unsafe evidence formatting is withheld.
    }
  }

  return { dataError, latest, overview, revenueEvidence, reviewedRevenue };
}
