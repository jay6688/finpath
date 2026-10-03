"use client";

import { useId, useState, type CSSProperties } from "react";

import { NumberPassport, type PassportRecord } from "./number-passport";
import styles from "./metric-dossier.module.css";

export type DossierPeriod = {
  id: string;
  label: string;
  displayValue: string;
  normalizedPercent: number;
  unavailable?: boolean;
  passport: PassportRecord<"Reported">;
};

export function MetricDossier({ company, metric, meaning, valueRole, periods, selectedPeriodId, onPeriodSelect, learnHref, relatedTrace, geometryReference }: {
  company: { name: string; ticker: string };
  metric: string;
  meaning: string;
  valueRole: "Reported";
  periods: DossierPeriod[];
  selectedPeriodId: string;
  onPeriodSelect: (id: string) => void;
  learnHref: string;
  relatedTrace: string;
  geometryReference: string;
}) {
  const titleId = useId();
  const traceTitleId = useId();
  const periodLegendId = useId();
  const periodGroupName = useId();
  const [passportExpanded, setPassportExpanded] = useState(false);
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
        <div className={styles.reported}><small>{valueRole}</small><strong>{selected.displayValue}</strong><span>{selected.label}</span></div>
      </header>
      <div className={styles.body} data-passport-expanded={passportExpanded}>
        <section className={styles.trace} aria-labelledby={traceTitleId}>
          <div className={styles.traceHeading}><div><p>Annual trace</p><h3 id={traceTitleId}>A record through time</h3></div><p>{relatedTrace}</p></div>
          <p className={styles.geometryReference}>{geometryReference}</p>
          <fieldset className={styles.periods} aria-labelledby={periodLegendId}>
            <legend id={periodLegendId}>{metric} reporting period</legend>
            {periods.map((period) => (
              <label key={period.id} data-selected={period.id === selectedPeriodId || undefined} data-unavailable={period.unavailable || undefined} style={{ "--dossier-percent": period.normalizedPercent } as CSSProperties}>
                <input type="radio" name={periodGroupName} value={period.id} checked={period.id === selectedPeriodId} disabled={period.unavailable} onChange={() => onPeriodSelect(period.id)} />
                <span className={styles.periodMark} aria-hidden="true" />
                <strong>{period.displayValue}</strong><small>{period.label}</small>
              </label>
            ))}
          </fieldset>
          <a className={styles.learn} href={learnHref}>Learn {metric} <span aria-hidden="true">→</span></a>
        </section>
        <NumberPassport numberLabel={`${company.name} ${selected.label} ${metric}`} record={selected.passport} onExpandedChange={setPassportExpanded} />
      </div>
    </article>
  );
}
