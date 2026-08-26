import type { CSSProperties } from "react";

import { RevenueHistoryInsight } from "@/components/revenue-history-insight";
import insightContent from "@/content/history-insights/aapl-revenue-fy2023.json";
import type { AnnualFinancialFact } from "@/lib/api";
import { selectGuidedRevenueObservation } from "@/lib/history-insight";

type RevenueHistoryProps = {
  currency: string;
  series: AnnualFinancialFact[];
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

export function RevenueHistory({ currency, series }: RevenueHistoryProps) {
  const largestValue = Math.max(...series.map((fact) => fact.value));
  const latestEndDate = series.at(-1)?.endDate;
  const selectedObservation = selectGuidedRevenueObservation(series);
  const guidedObservation =
    selectedObservation?.current.fiscalYear === insightContent.selectedFiscalYear &&
    selectedObservation.selectionRule === insightContent.selectionRule
      ? selectedObservation
      : null;
  const chartDescription = series
    .map((fact) => `FY${fact.fiscalYear} ${compactCurrency.format(fact.value)}`)
    .join(", ");

  return (
    <div className="revenue-history">
      <div className="revenue-chart__heading">
        <h3>Five-year Revenue history</h3>
        <span>{currency} billions</span>
      </div>
      <div
        className="revenue-chart"
        role="img"
        aria-label={`Annual Revenue history in ${currency}: ${chartDescription}`}
      >
        {series.map((fact) => {
          const relativeHeight = largestValue === 0 ? 0 : fact.value / largestValue;
          const barStyle = {
            "--bar-height": `${Math.max(relativeHeight * 100, 8)}%`,
          } as CSSProperties;

          return (
            <div
              className={[
                "revenue-bar",
                fact.endDate === latestEndDate ? "revenue-bar--current" : "",
                fact.fiscalYear === guidedObservation?.current.fiscalYear
                  ? "revenue-bar--guided"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={fact.endDate}
            >
              <span className="revenue-bar__value">{compactCurrency.format(fact.value)}</span>
              <span
                className="revenue-bar__shape"
                style={barStyle}
              />
              <span className="revenue-bar__year">FY{fact.fiscalYear}</span>
            </div>
          );
        })}
      </div>

      {guidedObservation ? (
        <RevenueHistoryInsight observation={guidedObservation} />
      ) : null}

      <section className="exact-record" aria-labelledby="exact-record-heading">
        <div className="exact-record__heading">
          <div>
            <p className="eyebrow">Exact record</p>
            <h3 id="exact-record-heading">Reported Revenue history</h3>
          </div>
          <span>Values in {currency}</span>
        </div>

        <table className="revenue-table">
          <caption className="sr-only">
            Annual Revenue values in {currency} and source filings
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
            {series.map((fact) => (
              <tr key={fact.endDate}>
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

        <div className="mobile-records" aria-label={`Annual Revenue values in ${currency}`}>
          {series.toReversed().map((fact, index) => (
            <details key={fact.endDate} open={index === 0}>
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
