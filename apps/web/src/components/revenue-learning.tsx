"use client";

import { useState } from "react";

import { EvidenceInspector } from "@/components/evidence-inspector";
import styles from "@/components/revenue-learning.module.css";
import revenueConcept from "@/content/concepts/revenue.json";
import type { CompanyRevenueData } from "@/lib/company-revenue-data";

type Lens = "meaning" | "period" | "profit";

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const lensCopy: Record<Lens, { label: string; title: string; body: string }> = {
  meaning: {
    label: "What it represents",
    title: "The reported top line",
    body: "Revenue measures the amount earned from selling products and services during the reporting period, before the costs and expenses that lead to Profit.",
  },
  period: {
    label: "Reporting period",
    title: "A duration, not a point in time",
    body: "Annual Revenue covers the full fiscal-year period shown in the filing. It is not the amount held by the company on the final day.",
  },
  profit: {
    label: "Relationship to Profit",
    title: "The starting scale, not what remains",
    body: "Profit begins with Revenue and then reflects costs and expenses. Revenue is not Profit, company value or Market Cap.",
  },
};

export function RevenueLearning({
  company,
  dataError,
  latest,
  overview,
  revenueEvidence,
}: CompanyRevenueData) {
  const [lens, setLens] = useState<Lens>("meaning");
  const selected = lensCopy[lens];
  const teachingSources = revenueConcept.sources.filter(
    (source) =>
      !source.supports.includes("appleExample") || company.ticker === "AAPL",
  );

  if (!overview || !latest) {
    return (
      <div className="data-empty-state profit-data-empty" role="status">
        <div className="data-empty-state__value" aria-hidden="true">—</div>
        <div>
          <strong>Revenue data is not available</strong>
          <p>{dataError}</p>
          <p>FinPath will not replace a missing SEC response with a financial fallback.</p>
        </div>
      </div>
    );
  }

  return (
    <article className={styles.lesson} aria-labelledby="revenue-question">
      <header className={styles.introduction}>
        <p className="eyebrow">Top-line reference</p>
        <h2 id="revenue-question">What is Revenue, and where does it sit in the company&apos;s financial story?</h2>
        <p>
          Revenue is the reported starting scale for the period: the top-line
          amount before the costs and expenses that lead to Profit.
        </p>
      </header>

      <section className={styles.reference} aria-labelledby="revenue-object-heading">
        <div className={styles.referenceHeader}>
          <div>
            <span className={styles.provenance}>Reported</span>
            <h3 id="revenue-object-heading">{overview.metric.label}</h3>
          </div>
          <span>FY{latest.fiscalYear} · {latest.startDate} to {latest.endDate}</span>
        </div>
        <div className={styles.topLine}>
          <span>Top line · 100% reference for later Profit and Margin lessons</span>
          <strong>{exactBillions.format(latest.value / 1_000_000_000)}B</strong>
        </div>
        <p className={styles.boundary}>
          Reported Revenue does not mean the same amount was collected as cash in
          this period. It is also not Profit, company value or Market Cap.
        </p>
      </section>

      <section className={styles.inspection} aria-labelledby="revenue-inspection-heading">
        <div>
          <p className="eyebrow">Inspect the object</p>
          <h3 id="revenue-inspection-heading">Keep three meanings separate</h3>
        </div>
        <div className={styles.controls} role="group" aria-label="Revenue meaning lenses">
          {(Object.keys(lensCopy) as Lens[]).map((id) => (
            <button
              aria-pressed={lens === id}
              key={id}
              onClick={() => setLens(id)}
              type="button"
            >
              {lensCopy[id].label}
            </button>
          ))}
        </div>
        <div className={styles.explanation} aria-live="polite">
          <h4>{selected.title}</h4>
          <p>{selected.body}</p>
        </div>
      </section>

      {revenueEvidence ? (
        <EvidenceInspector evidence={revenueEvidence} id="revenue-learning-evidence" />
      ) : null}

      <details className={styles.teachingNotes}>
        <summary>Teaching notes and 中文解释</summary>
        <div>
          <p>{revenueConcept.locales.en.whyItMatters}</p>
          <p lang="zh-CN">{revenueConcept.locales["zh-CN"].simpleDefinition}</p>
          <ul>
            {teachingSources.map((source) => (
              <li key={source.id}>
                <a href={source.url} rel="noreferrer" target="_blank">{source.title}</a>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </article>
  );
}
