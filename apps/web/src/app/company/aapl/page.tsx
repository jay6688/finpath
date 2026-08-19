import type { Metadata } from "next";
import Link from "next/link";

import { RevenueHistory } from "@/components/revenue-history";
import revenueConcept from "@/content/concepts/revenue.json";
import { FinPathApiError, getCompanyOverview } from "@/lib/api";

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

  const latest = overview?.series.at(-1);

  return (
    <div className="company-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Apple</span>
      </nav>

      <header className="company-header">
        <div>
          <p className="eyebrow">Company record</p>
          <h1>{overview?.company.name ?? "Apple Inc."}</h1>
          <p className="company-header__meta">
            AAPL · Nasdaq · SEC CIK {overview?.company.cik ?? "0000320193"}
          </p>
        </div>
        <span className="coverage-badge">V0 supported</span>
      </header>

      <section className="annotated-record" aria-labelledby="revenue-heading">
        <div className="metric-column">
          <div className="metric-heading">
            <div>
              <p className="eyebrow">Income statement · Annual</p>
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
              </div>

              <RevenueHistory currency={overview.metric.currency} series={overview.series} />

              <div className="source-row">
                <span>Latest source</span>
                <a href={latest.sourceUrl} rel="noreferrer" target="_blank">
                  SEC {latest.form} · filed {latest.filedAt} · {latest.accession}
                </a>
              </div>
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
          <div className="learning-margin__line" aria-hidden="true" />
          <p className="eyebrow">Learning margin</p>
          <h2 id="learning-heading">{english.title}</h2>
          <p className="learning-margin__lead">{english.simpleDefinition}</p>

          <section>
            <h3>Why this matters</h3>
            <p>{english.whyItMatters}</p>
          </section>

          <section>
            <h3>What it cannot tell you</h3>
            <p>{english.limitation}</p>
          </section>

          <details className="language-note">
            <summary>Explain in Chinese</summary>
            <p lang="zh-CN">{revenueConcept.locales["zh-CN"].simpleDefinition}</p>
          </details>

          <div className="teaching-sources">
            <h3>Explanation sources</h3>
            <ul>
              {revenueConcept.sources.map((source) => (
                <li key={source.id}>
                  <a href={source.url} rel="noreferrer" target="_blank">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
