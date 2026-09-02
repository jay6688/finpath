import { RevenueGrowthExplorer } from "@/components/revenue-growth-explorer";
import { RevenueHistoryInsight } from "@/components/revenue-history-insight";
import insightContent from "@/content/history-insights/aapl-revenue-fy2023.json";
import type { CompanyOverview } from "@/lib/api";
import type { ReviewedPresentation } from "@/lib/evidence";
import {
  orderRevenueSeries,
  selectGuidedRevenueObservation,
} from "@/lib/history-insight";

type RevenueHistoryProps = {
  overview: CompanyOverview;
  reviewedPresentation?: ReviewedPresentation | null;
};

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const exactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function RevenueHistory({
  overview,
  reviewedPresentation,
}: RevenueHistoryProps) {
  const { company, dataStatus, metric } = overview;
  const orderedSeries = orderRevenueSeries(overview.series);
  const selectedObservation = selectGuidedRevenueObservation(orderedSeries);
  const guidedObservation =
    selectedObservation?.current.fiscalYear === insightContent.selectedFiscalYear &&
    selectedObservation.selectionRule === insightContent.selectionRule
      ? selectedObservation
      : null;

  return (
    <div className="revenue-history">
      <RevenueGrowthExplorer
        company={company}
        currency={metric.currency}
        dataStatus={dataStatus}
        defaultFiscalYear={insightContent.selectedFiscalYear}
        reviewedPresentation={reviewedPresentation}
        series={orderedSeries}
        taxonomyTag={metric.taxonomyTag}
      />

      {guidedObservation ? (
        <RevenueHistoryInsight observation={guidedObservation} />
      ) : null}

      <section className="exact-record" aria-labelledby="exact-record-heading">
        <div className="exact-record__heading">
          <div>
            <p className="eyebrow">Exact record</p>
            <h3 id="exact-record-heading">Reported Revenue history</h3>
          </div>
          <span>Values in {metric.currency}</span>
        </div>

        <table className="revenue-table">
          <caption className="sr-only">
            Annual Revenue values in {metric.currency} and source filings
          </caption>
          <thead>
            <tr>
              <th scope="col">Fiscal year</th>
              <th scope="col">Revenue</th>
              <th scope="col">Period end</th>
              <th scope="col">Filed</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {orderedSeries.map((fact, index) => (
              <tr key={`${fact.fiscalYear}-${fact.accession}-${fact.endDate}-${index}`}>
                <th scope="row">FY{fact.fiscalYear}</th>
                <td>{exactCurrency.format(fact.value)}</td>
                <td>{fact.endDate}</td>
                <td>{fact.filedAt}</td>
                <td>
                  <a
                    aria-label={`${fact.form} filing for fiscal year ${fact.fiscalYear}`}
                    href={fact.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {fact.form}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mobile-records" aria-label={`Annual Revenue values in ${metric.currency}`}>
          {orderedSeries.toReversed().map((fact, index) => (
            <details
              key={`${fact.fiscalYear}-${fact.accession}-${fact.endDate}-${index}`}
              open={index === 0}
            >
              <summary>
                <span>
                  <strong>FY{fact.fiscalYear}</strong>
                  <small>Revenue</small>
                </span>
                <b>{compactCurrency.format(fact.value)}</b>
              </summary>
              <dl>
                <div>
                  <dt>Exact value</dt>
                  <dd>{exactCurrency.format(fact.value)}</dd>
                </div>
                <div>
                  <dt>Period ended</dt>
                  <dd>{fact.endDate}</dd>
                </div>
                <div>
                  <dt>Filed</dt>
                  <dd>{fact.filedAt}</dd>
                </div>
                <div>
                  <dt>Form</dt>
                  <dd>{fact.form}</dd>
                </div>
                <div>
                  <dt>Accession</dt>
                  <dd>{fact.accession}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>
                    <a
                      aria-label={`Open ${fact.form} filing for fiscal year ${fact.fiscalYear} on SEC.gov`}
                      href={fact.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open SEC filing ↗
                    </a>
                  </dd>
                </div>
              </dl>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
