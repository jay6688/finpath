"use client";

import { useEffect, useId, useState } from "react";

import styles from "./number-passport.module.css";

export type PassportRecord = {
  status: "Reported" | "Derived" | "Verification" | "Unavailable";
  reportingPeriod: string;
  form?: string;
  filedAt?: string;
  officialSourceUrl?: string;
  sourceLocation?: string;
};

const passportStates = ["closed", "opening", "open", "closing"] as const;
type PassportState = (typeof passportStates)[number];

export function NumberPassport({ numberLabel, record }: { numberLabel: string; record: PassportRecord }) {
  const [state, setState] = useState<PassportState>("closed");
  const panelId = useId();
  const expanded = state === "opening" || state === "open";
  const panelVisible = state !== "closed";
  const unavailable = record.status === "Unavailable";

  useEffect(() => {
    if (state !== "opening" && state !== "closing") return;
    const finish = window.setTimeout(() => setState(state === "opening" ? "open" : "closed"), 180);
    return () => window.clearTimeout(finish);
  }, [state]);

  function toggle() {
    setState(expanded ? "closing" : "opening");
  }

  return (
    <aside className={styles.passport} data-state={state} data-unavailable={unavailable || undefined} aria-label={`Number Passport for ${numberLabel}`}>
      <button type="button" onClick={toggle} aria-expanded={expanded} aria-controls={panelId} disabled={unavailable}>
        <span><small>Number Passport</small><strong>{record.status}</strong></span>
        <i aria-hidden="true">{expanded ? "−" : "+"}</i>
      </button>
      <div className={styles.record} id={panelId} hidden={!panelVisible}>
        {unavailable ? <p role="status">Evidence is unavailable for this number.</p> : (
          <>
            <dl>
              <div><dt>Status</dt><dd>{record.status}</dd></div>
              <div><dt>Reporting period</dt><dd>{record.reportingPeriod}</dd></div>
              {record.form ? <div><dt>Form</dt><dd>{record.form}</dd></div> : null}
              {record.filedAt ? <div><dt>Filed</dt><dd>{record.filedAt}</dd></div> : null}
              {record.sourceLocation ? <div><dt>Source location</dt><dd>{record.sourceLocation}</dd></div> : null}
            </dl>
            {record.officialSourceUrl ? <a href={record.officialSourceUrl} target="_blank" rel="noreferrer">Open Official source <span aria-hidden="true">↗</span></a> : <p role="status">Official source link unavailable.</p>}
          </>
        )}
      </div>
    </aside>
  );
}
