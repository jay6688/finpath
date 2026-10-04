import Link from "next/link";
import type { ReactNode } from "react";

import type { SupportedCompany } from "@/lib/api";
import type { CompanyRevenueData } from "@/lib/company-revenue-data";

import styles from "./company-workspace.module.css";

const sourceStateLabel = {
  live: "Live reviewed source",
  cached: "Reviewed cache",
  stale: "Reviewed cache · source refresh unavailable",
} as const;

export function CompanyResearchWorkspace({
  children,
  company,
  isDossier,
  revenueData,
}: {
  children: ReactNode;
  company: SupportedCompany;
  isDossier: boolean;
  revenueData: CompanyRevenueData;
}) {
  const reportingFact = revenueData.latest;
  const sourceState = revenueData.overview?.dataStatus.state;

  return (
    <div className={styles.canvas}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/explore">Explore</Link>
        <span aria-hidden="true">/</span>
        <strong>{company.ticker}</strong>
      </nav>

      <header className={styles.workspaceHeader}>
        <div className={styles.identity}>
          <p>Explore · Reviewed company workspace</p>
          <h1>{company.name}</h1>
          <span>{company.ticker} · SEC CIK {company.cik}</span>
        </div>

        <dl className={styles.reportingContext}>
          <div>
            <dt>Reporting context</dt>
            <dd>
              {reportingFact
                ? `FY${reportingFact.fiscalYear} · ${reportingFact.form}`
                : "Unavailable"}
            </dd>
          </div>
          <div>
            <dt>Reviewed-source status</dt>
            <dd>{sourceState ? sourceStateLabel[sourceState] : "Unavailable"}</dd>
          </div>
        </dl>
      </header>

      <div className={styles.contextRail}>
        <span>{isDossier ? "Independent research" : "Transitional workspace"}</span>
        <strong>
          {isDossier ? "Object → Trace → Passport" : "Existing reviewed research body"}
        </strong>
        <Link href="/explore">All companies</Link>
      </div>

      {children}
    </div>
  );
}
