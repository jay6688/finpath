"use client";

import Link from "next/link";
import { useState } from "react";

import type { SupportedCompany } from "@/lib/api";
import type { CompanyRevenueRecord } from "@/lib/company-revenue-data";
import { selectRevenueRecord } from "@/lib/revenue-dossier";

import { NumberPassport } from "./number-passport";
import { PeriodSelector } from "./period-selector";
import styles from "./metric-dossier.module.css";

const exactBillions = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatExactBillions(value: number): string {
  return `${exactBillions.format(value / 1_000_000_000)}B`;
}

export function MetricDossier({
  company,
  dataError,
  records,
}: {
  company: SupportedCompany;
  dataError: string | null;
  records: CompanyRevenueRecord[];
}) {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(
    records.at(-1)?.fact.fiscalYear ?? null,
  );

  if (selectedFiscalYear === null || records.length === 0) {
    return (
      <section className={styles.unavailable} role="status">
        <p>Revenue · Reviewed data unavailable</p>
        <h2>FinPath cannot show this research object right now.</h2>
        <p>{dataError ?? "No reviewed annual Revenue records are available."}</p>
        <strong>No financial value has been substituted.</strong>
      </section>
    );
  }

  const selected = selectRevenueRecord(records, selectedFiscalYear);

  return (
    <article className={styles.dossier} aria-labelledby="revenue-dossier-heading">
      <header className={styles.identity}>
        <div>
          <p>Performance object · Reported</p>
          <h2 id="revenue-dossier-heading">Revenue</h2>
          <p>Money Apple reported from customers before costs and expenses.</p>
        </div>

        <div className={styles.currentValue} aria-live="polite">
          <span>FY{selected.fact.fiscalYear} · USD billions</span>
          <strong>{formatExactBillions(selected.fact.value)}</strong>
          <small>Reported · year ended {selected.fact.endDate}</small>
        </div>
      </header>

      <div className={styles.researchBody}>
        <div className={styles.trace}>
          <div className={styles.traceHeading}>
            <div>
              <p>Historical trace</p>
              <h3>Inspect the same Revenue object across annual periods.</h3>
            </div>
            <span>Selected: FY{selected.fact.fiscalYear}</span>
          </div>
          <PeriodSelector
            onSelect={setSelectedFiscalYear}
            records={records}
            selectedFiscalYear={selected.fact.fiscalYear}
          />
        </div>

        <NumberPassport record={selected} />
      </div>

      <footer className={styles.support}>
        <div>
          <p>Interpretation boundary</p>
          <h3>Revenue is the top line, not Profit or cash movement.</h3>
          <span>
            Use the trace to compare reported scale. The filing record explains
            where each selected number came from, not why it changed.
          </span>
        </div>
        <Link href={`/learn/company-analysis/revenue?company=${company.slug}`}>
          I want to understand Revenue better
          <span aria-hidden="true"> →</span>
        </Link>
      </footer>
    </article>
  );
}
