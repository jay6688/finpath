import { EvidenceInspector } from "@/components/evidence-inspector";
import type { CompanyRevenueData } from "@/lib/company-revenue-data";

type RevenueMetricSnapshotProps = CompanyRevenueData & {
  headingId: string;
};

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export function RevenueMetricSnapshot({
  dataError,
  headingId,
  latest,
  overview,
  revenueEvidence,
}: RevenueMetricSnapshotProps) {
  return (
    <>
      <div className="metric-heading">
        <div>
          <p className="eyebrow">Annual Revenue</p>
          <h2 id={headingId}>Revenue</h2>
        </div>
        {overview ? (
          <span className="metric-state" data-state={overview.dataStatus.state}>
            {overview.dataStatus.state} data
          </span>
        ) : null}
      </div>

      {overview && latest ? (
        <>
          <div className="metric-latest">
            <strong>{exactBillions.format(latest.value / 1_000_000_000)}B</strong>
            <span>
              FY{latest.fiscalYear} · {overview.metric.currency} · year ended {latest.endDate}
            </span>
            <a href={latest.sourceUrl} rel="noreferrer" target="_blank">
              SEC {latest.form} ↗
            </a>
          </div>

          {revenueEvidence ? (
            <EvidenceInspector evidence={revenueEvidence} id="revenue-evidence" />
          ) : null}

          <p className="retrieved-note">
            Retrieved {new Date(overview.dataStatus.retrievedAt).toLocaleString("en-MY", {
              timeZone: "Asia/Kuala_Lumpur",
            })}
            {overview.dataStatus.state === "stale"
              ? " · SEC was unavailable, so FinPath is showing the last known public filing data."
              : ""}
          </p>
        </>
      ) : (
        <div className="data-empty-state" role="status">
          <div className="data-empty-state__value" aria-hidden="true">—</div>
          <div>
            <strong>Revenue data is not available yet</strong>
            <p>{dataError}</p>
            <p>
              FinPath will not replace a missing SEC response with a hard-coded
              financial value.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
