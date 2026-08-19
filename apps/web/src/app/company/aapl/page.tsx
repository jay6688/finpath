import type { Metadata } from "next";
import Link from "next/link";

import revenueConcept from "@/content/concepts/revenue.json";

export const metadata: Metadata = {
  title: "Apple Revenue",
  description: "Explore Apple's Revenue with beginner-friendly context and source provenance.",
};

export default function AppleCompanyPage() {
  const english = revenueConcept.locales.en;

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
          <h1>Apple Inc.</h1>
          <p className="company-header__meta">AAPL · Nasdaq · SEC CIK 0000320193</p>
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
            <span className="metric-state">Data pipeline next</span>
          </div>

          <div className="data-empty-state" role="status">
            <div className="data-empty-state__value" aria-hidden="true">
              —
            </div>
            <div>
              <strong>No hard-coded financial value</strong>
              <p>
                The scaffold is ready. Revenue will appear only after FastAPI retrieves,
                normalizes, caches, and links the real SEC fact to its filing.
              </p>
            </div>
          </div>

          <div className="chart-scaffold" aria-label="Future five-year Revenue chart area">
            <span>Five-year annual Revenue chart</span>
            <div className="chart-scaffold__bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="source-row">
            <span>Source</span>
            <strong>Pending verified SEC response</strong>
          </div>
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

