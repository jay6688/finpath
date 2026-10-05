import type { CompanyRevenueRecord } from "@/lib/company-revenue-data";

import styles from "./metric-dossier.module.css";

export function NumberPassport({ record }: { record: CompanyRevenueRecord }) {
  const { evidence, fact } = record;
  const sourceUrl =
    evidence?.sourceCapability.filingLink === "available"
      ? evidence.filing.sourceUrl
      : undefined;
  const evidenceAvailable = Boolean(sourceUrl);

  return (
    <details className={styles.passport}>
      <summary>
        <span>
          <small>Attached provenance</small>
          <strong>Number Passport · FY{fact.fiscalYear}</strong>
        </span>
        <span className={styles.passportAction}>
          <span className={styles.closedAction}>Open record</span>
          <span className={styles.openAction}>Close record</span>
        </span>
      </summary>

      <div className={styles.passportBody}>
        <p>Evidence for the selected Revenue number</p>
        <dl>
          <div>
            <dt>Value role</dt>
            <dd>Reported</dd>
          </div>
          <div>
            <dt>Evidence availability</dt>
            <dd>{evidenceAvailable ? "Available" : "Unavailable"}</dd>
          </div>
          <div>
            <dt>Selected reporting period</dt>
            <dd>Year ended {fact.endDate}</dd>
          </div>
          <div>
            <dt>Source filing</dt>
            <dd>{fact.form}</dd>
          </div>
          <div>
            <dt>Filed</dt>
            <dd>{fact.filedAt}</dd>
          </div>
          <div>
            <dt>Accession</dt>
            <dd>{fact.accession}</dd>
          </div>
        </dl>

        <p className={styles.sourceRelationship}>
          This period may appear as comparative data in a later filing.
        </p>

        {sourceUrl ? (
          <a href={sourceUrl} rel="noreferrer" target="_blank">
            Open supporting SEC filing
            <span aria-hidden="true"> ↗</span>
          </a>
        ) : (
          <p className={styles.sourceUnavailable}>
            Supporting SEC filing link unavailable for this record.
          </p>
        )}
      </div>
    </details>
  );
}
