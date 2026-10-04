import Link from "next/link";

import type { SupportedCompany } from "@/lib/api";

import styles from "./explore-composition.module.css";

function reviewedConcepts(company: SupportedCompany): string[] {
  const concepts = ["Revenue"];
  if (company.capabilities.incomeStatement) concepts.push("Profit");
  if (company.capabilities.cashFlow) concepts.push("Cash Flow");
  if (company.capabilities.balanceSheet) concepts.push("Financial Position");
  if (company.capabilities.earningsPerShare) concepts.push("Per Share");
  return concepts;
}

export function ExploreDirectory({
  companies,
}: {
  companies: SupportedCompany[];
}) {
  return (
    <div className={styles.canvas}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <strong>Explore</strong>
      </nav>

      <header className={styles.introduction}>
        <p className={styles.mode}>Explore · Independent research</p>
        <h1>Pick a real company and inspect how its financial records connect.</h1>
        <p>
          Move from a reported number to its annual trace and filing evidence.
          FinPath shows reviewed records, not market calls.
        </p>
      </header>

      <section className={styles.directory} aria-labelledby="company-index-heading">
        <header className={styles.directoryHeader}>
          <div>
            <p>Reviewed-company index</p>
            <h2 id="company-index-heading">Choose a research workspace</h2>
          </div>
          <span>{companies.length} reviewed companies</span>
        </header>

        <ol className={styles.companyList}>
          {companies.map((company, index) => {
            const concepts = reviewedConcepts(company);
            return (
              <li key={company.ticker}>
                <span className={styles.index} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className={styles.identity}>
                  <span>{company.ticker}</span>
                  <h3>{company.name}</h3>
                  <p>Reviewed through FY{company.reviewedFiscalYear}</p>
                </div>
                <div className={styles.coverage}>
                  <span>Research available</span>
                  <ul aria-label={`${company.name} reviewed concepts`}>
                    {concepts.map((concept) => <li key={concept}>{concept}</li>)}
                  </ul>
                </div>
                <Link className={styles.action} href={`/company/${company.slug}`}>
                  Inspect records <span aria-hidden="true">→</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <p className={styles.boundary}>
        Company coverage reflects the current reviewed-data registry. It is not
        a ranking, watchlist, or investment recommendation.
      </p>
    </div>
  );
}

export function ExploreDirectoryUnavailable() {
  return (
    <div className={styles.canvas}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <strong>Explore</strong>
      </nav>
      <section className={styles.unavailable} role="alert">
        <p className={styles.mode}>Explore · Data unavailable</p>
        <h1>Company research is temporarily unavailable.</h1>
        <p>
          FinPath could not reach the reviewed-company registry. No company or
          financial record has been substituted.
        </p>
      </section>
    </div>
  );
}
