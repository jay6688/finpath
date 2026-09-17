import profitContent from "@/content/profit-lessons/aapl-profit-fy2025.json";
import {
  FinPathApiError,
  getCompanyIncomeStatement,
  getCompanyOverview,
  type AnnualFinancialFact,
  type CompanyIncomeStatement,
  type CompanyOverview,
  type IncomeStatementLineId,
  type SupportedCompany,
} from "@/lib/api";
import {
  buildReportedEvidence,
  buildReviewedPresentation,
  type ReportedEvidence,
  type ReviewedPresentation,
} from "@/lib/evidence";
import { orderRevenueSeries } from "@/lib/history-insight";
import { validateProfitStatementForLesson } from "@/lib/profit-learning";

export type CompanyRevenueData = {
  company: SupportedCompany;
  dataError: string | null;
  latest: AnnualFinancialFact | null;
  overview: CompanyOverview | null;
  revenueEvidence: ReportedEvidence | null;
  reviewedRevenue: ReviewedPresentation | null;
};

const appleReviewedLabels = Object.fromEntries(
  Object.entries(profitContent.lines).map(([id, line]) => [id, line.reportedLabel]),
) as Partial<Record<IncomeStatementLineId, string>>;

export async function getCompanyRevenueData(
  company: SupportedCompany,
): Promise<CompanyRevenueData> {
  let overview: CompanyOverview | null = null;
  let incomeStatement: CompanyIncomeStatement | null = null;
  let dataError: string | null = null;

  const overviewResult = await Promise.allSettled([
    getCompanyOverview(company.ticker),
  ]);
  const selectedOverview = overviewResult[0];
  if (selectedOverview.status === "fulfilled") {
    overview = {
      ...selectedOverview.value,
      series: orderRevenueSeries(selectedOverview.value.series),
    };
  } else {
    dataError =
      selectedOverview.reason instanceof FinPathApiError
        ? selectedOverview.reason.message
        : "The FinPath API is not available. Start FastAPI and try again.";
  }

  // Apple is the only company whose filing presentation copy is currently
  // reviewed in the Web layer. Other companies retain exact SEC fact evidence
  // without borrowing Apple's labels or statement context.
  if (company.ticker === "AAPL") {
    try {
      const statement = await getCompanyIncomeStatement(
        company.ticker,
        company.reviewedFiscalYear,
      );
      validateProfitStatementForLesson(statement.statement, {
        fiscalYear: profitContent.fiscalYear,
        accession: profitContent.accession,
      });
      incomeStatement = statement;
    } catch {
      // Revenue remains usable; reviewed statement context degrades honestly.
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
        labels: appleReviewedLabels,
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

  return {
    company,
    dataError,
    latest,
    overview,
    revenueEvidence,
    reviewedRevenue,
  };
}
