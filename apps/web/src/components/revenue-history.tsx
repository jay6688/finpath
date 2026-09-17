import { RevenueGrowthExplorer } from "@/components/revenue-growth-explorer";
import { RevenueHistoryContext } from "@/components/revenue-history-context";
import { RevenueExactRecords } from "@/components/revenue-exact-records";
import contextContent from "@/content/company-context/aapl-revenue-fy2023.json";
import type { CompanyOverview } from "@/lib/api";
import type { ReviewedPresentation } from "@/lib/evidence";
import { buildRevenueGrowthRows, orderRevenueSeries } from "@/lib/history-insight";

type RevenueHistoryProps = {
  overview: CompanyOverview;
  reviewedPresentation?: ReviewedPresentation | null;
};

export function RevenueHistory({
  overview,
  reviewedPresentation,
}: RevenueHistoryProps) {
  const { company, dataStatus, metric } = overview;
  const orderedSeries = orderRevenueSeries(overview.series);
  const hasReviewedContext = company.ticker === "AAPL" && buildRevenueGrowthRows(orderedSeries).some(
    (row) =>
      row.state === "available" &&
      row.current.fiscalYear === contextContent.selectedFiscalYear &&
      row.previous.fiscalYear === contextContent.previousFiscalYear &&
      row.direction === "decrease",
  );

  return (
    <div className="revenue-history">
      <RevenueGrowthExplorer
        company={company}
        currency={metric.currency}
        dataStatus={dataStatus}
        defaultFiscalYear={
          company.ticker === "AAPL"
            ? contextContent.selectedFiscalYear
            : (orderedSeries.at(-1)?.fiscalYear ?? 0)
        }
        reviewedPresentation={reviewedPresentation}
        series={orderedSeries}
        taxonomyTag={metric.taxonomyTag}
      />

      {hasReviewedContext ? <RevenueHistoryContext /> : null}

      <RevenueExactRecords overview={{ ...overview, series: orderedSeries }} />
    </div>
  );
}
