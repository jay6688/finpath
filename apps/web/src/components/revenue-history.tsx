import type { CSSProperties } from "react";

import type { AnnualFinancialFact } from "@/lib/api";

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

  return (
    <div className="revenue-history">
      <div
        className="revenue-chart"
        role="img"
        aria-label={`Annual Revenue history in ${currency} from fiscal year ${series[0]?.fiscalYear} to ${series.at(-1)?.fiscalYear}`}
      >
        {series.map((fact) => {
          const relativeHeight = largestValue === 0 ? 0 : fact.value / largestValue;
          const barStyle = {
            "--bar-height": `${Math.max(relativeHeight * 100, 8)}%`,
          } as CSSProperties;

          return (
            <div className="revenue-bar" key={fact.endDate}>
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

      <div className="revenue-table-wrap">
        <table className="revenue-table">
          <caption>Annual Revenue values in {currency} and source filings</caption>
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
      </div>
    </div>
  );
}
