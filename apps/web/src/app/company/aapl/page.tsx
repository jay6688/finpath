import type { Metadata } from "next";
import Link from "next/link";

import { RevenueHistory } from "@/components/revenue-history";
import revenueConcept from "@/content/concepts/revenue.json";
import { FinPathApiError, getCompanyOverview } from "@/lib/api";
import { orderRevenueSeries } from "@/lib/history-insight";

export const metadata: Metadata = {
  title: "Apple Revenue",
  description: "Explore Apple's Revenue with beginner-friendly context and source provenance.",
};

export const dynamic = "force-dynamic";

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export default async function AppleCompanyPage() {
  const english = revenueConcept.locales.en;
  let overview = null;
  let dataError = null;

  try {
    overview = await getCompanyOverview("AAPL");
  } catch (error) {
    dataError =
      error instanceof FinPathApiError
        ? error.message
        : "The FinPath API is not available. Start FastAPI and try again.";
  }

  const orderedSeries = overview ? orderRevenueSeries(overview.series) : [];
  const latest = orderedSeries.at(-1);

  return (
    <div className="company-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Explore</span>
        <span aria-hidden="true">/</span>
        <strong>Apple Inc.</strong>
      </nav>

      <header className="company-header">
        <div>
          <p className="eyebrow">Company research</p>
          <h1>{overview?.company.name ?? "Apple Inc."}</h1>
          <p className="company-header__meta">
            AAPL · Nasdaq · SEC CIK {overview?.company.cik ?? "0000320193"}
          </p>
        </div>
        <span className="source-connected">SEC source connected</span>
      </header>

      <section className="research-grid" aria-labelledby="revenue-heading">
        <div className="metric-column">
          <div className="metric-heading">
            <div>
              <p className="eyebrow">Annual Revenue</p>
              <h2 id="revenue-heading">Revenue</h2>
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
                <strong>{compactCurrency.format(latest.value)}</strong>
                <span>
                  FY{latest.fiscalYear} · {overview.metric.currency} · year ended {latest.endDate}
                </span>
                <a href={latest.sourceUrl} rel="noreferrer" target="_blank">
                  SEC {latest.form} ↗
                </a>
              </div>

              <div className="learning-trace">
                <span aria-hidden="true" />
                <p>
                  <strong>This number</strong> is explained in the Learning Margin and linked to
                  its filing.
                </p>
              </div>

              <RevenueHistory currency={overview.metric.currency} series={orderedSeries} />

              <p className="retrieved-note">
                Retrieved {new Date(overview.dataStatus.retrievedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}
                {overview.dataStatus.state === "stale"
                  ? " · SEC was unavailable, so FinPath is showing the last known public filing data."
                  : ""}
              </p>
            </>
          ) : (
            <div className="data-empty-state" role="status">
              <div className="data-empty-state__value" aria-hidden="true">
                —
              </div>
              <div>
                <strong>Revenue data is not available yet</strong>
                <p>{dataError}</p>
                <p>
                  FinPath will not replace a missing SEC response with a hard-coded financial value.
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="learning-margin" aria-labelledby="learning-heading">
          <header className="learning-margin__header">
            <span aria-hidden="true" />
            <div>
              <p className="eyebrow">Learning margin</p>
              <h2 id="learning-heading">Understand the number</h2>
            </div>
          </header>

          <section className="learning-section learning-section--essential">
            <h3>{english.title}</h3>
            <p>{english.simpleDefinition}</p>
          </section>

          <section className="learning-section learning-section--essential">
            <h3>Why this matters</h3>
            <p>{english.whyItMatters}</p>
          </section>

          <section className="learning-section learning-section--essential">
            <h3>What it cannot tell you</h3>
            <p>{english.limitation}</p>
          </section>

          <details className="learning-section">
            <summary>Revenue vs Profit</summary>
            <p>{english.comparison}</p>
          </details>

          <details className="learning-section">
            <summary>中文解释</summary>
            <p lang="zh-CN">{revenueConcept.locales["zh-CN"].simpleDefinition}</p>
          </details>

          <details className="learning-section teaching-sources">
            <summary>Teaching sources</summary>
            <ul>
              {revenueConcept.sources.map((source) => (
                <li key={source.id}>
                  <a href={source.url} rel="noreferrer" target="_blank">
                    {source.title}
                  </a>
                  <span>{source.publisher}</span>
                </li>
              ))}
            </ul>
          </details>
        </aside>
      </section>
    </div>
  );
}
