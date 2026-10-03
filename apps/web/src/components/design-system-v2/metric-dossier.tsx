"use client";

import { useId, type CSSProperties } from "react";

import { NumberPassport, type PassportRecord } from "./number-passport";
import styles from "./metric-dossier.module.css";

export type DossierPeriod = {
  id: string;
  label: string;
  displayValue: string;
  normalizedPercent: number;
  passport: PassportRecord;
};

export function MetricDossier({ company, metric, meaning, periods, selectedPeriodId, onPeriodSelect, learnHref, relatedTrace }: {
  company: { name: string; ticker: string };
  metric: string;
  meaning: string;
  periods: DossierPeriod[];
  selectedPeriodId: string;
  onPeriodSelect: (id: string) => void;
  learnHref: string;
  relatedTrace: string;
}) {
  const titleId = useId();
  const traceTitleId = useId();
  const selected = periods.find((period) => period.id === selectedPeriodId);
  if (!selected) throw new RangeError(`MetricDossier selectedPeriodId ${selectedPeriodId} is not present in periods`);
  for (const period of periods) {
    if (!Number.isFinite(period.normalizedPercent) || period.normalizedPercent < 0 || period.normalizedPercent > 100) {
      throw new RangeError("normalizedPercent must be validated presentation geometry from 0 to 100");
    }
  }

  return (
    <article className={styles.dossier} aria-labelledby={titleId}>
      <header>
        <div><p>{company.name} · {company.ticker}</p><h2 id={titleId}>{metric}</h2><span>{meaning}</span></div>
        <div className={styles.reported}><small>Reported</small><strong>{selected.displayValue}</strong><span>{selected.label}</span></div>
      </header>
      <div className={styles.body}>
        <section className={styles.trace} aria-labelledby={traceTitleId}>
          <div className={styles.traceHeading}><div><p>Annual trace</p><h3 id={traceTitleId}>A record through time</h3></div><p>{relatedTrace}</p></div>
          <div className={styles.periods} role="radiogroup" aria-label={`${metric} reporting period`}>
            {periods.map((period) => (
              <button key={period.id} type="button" role="radio" aria-checked={period.id === selectedPeriodId} onClick={() => onPeriodSelect(period.id)} style={{ "--dossier-percent": period.normalizedPercent } as CSSProperties}>
                <span aria-hidden="true"><i /></span><strong>{period.displayValue}</strong><small>{period.label}</small>
              </button>
            ))}
          </div>
          <a className={styles.learn} href={learnHref}>Learn {metric} <span aria-hidden="true">→</span></a>
        </section>
        <NumberPassport numberLabel={`${company.name} ${selected.label} ${metric}`} record={selected.passport} />
      </div>
    </article>
  );
}
