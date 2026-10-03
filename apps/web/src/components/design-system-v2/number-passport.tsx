"use client";

import { useEffect, useId, useState } from "react";

import styles from "./number-passport.module.css";

export type ValueEvidenceRole = "Reported" | "Derived" | "Verification";
export type EvidenceAvailability = "available" | "unavailable";

export type PassportRecord<Role extends ValueEvidenceRole = ValueEvidenceRole> = {
  valueRole: Role;
  availability: EvidenceAvailability;
  reportingPeriod: string;
  form?: string;
  filedAt?: string;
  officialSourceUrl?: string;
  sourceLocation?: string;
};

const passportStates = ["closed", "opening", "open", "closing"] as const;
type PassportState = (typeof passportStates)[number];

export function NumberPassport({ numberLabel, record, onExpandedChange }: { numberLabel: string; record: PassportRecord; onExpandedChange?: (expanded: boolean) => void }) {
  const [state, setState] = useState<PassportState>("closed");
  const panelId = useId();
  const expanded = state === "opening" || state === "open";
  const panelVisible = state !== "closed";
  const unavailable = record.availability === "unavailable";

  useEffect(() => {
    if (state !== "opening" && state !== "closing") return;
    const finish = window.setTimeout(() => setState(state === "opening" ? "open" : "closed"), 180);
    return () => window.clearTimeout(finish);
  }, [state]);

  function toggle() {
    const nextExpanded = !expanded;
    setState(nextExpanded ? "opening" : "closing");
    onExpandedChange?.(nextExpanded);
  }

  return (
    <aside className={styles.passport} data-state={state} data-unavailable={unavailable || undefined} aria-label={`Number Passport for ${numberLabel}`}>
      <button type="button" onClick={toggle} aria-expanded={expanded} aria-controls={panelId}>
        <span><small>Number Passport</small><strong>{record.valueRole}</strong><em>{unavailable ? "Evidence unavailable" : "Evidence available"}</em></span>
        <i aria-hidden="true">{expanded ? "−" : "+"}</i>
      </button>
      <div className={styles.record} id={panelId} hidden={!panelVisible}>
        {unavailable ? <p role="status">Evidence details are unavailable for this number.</p> : (
          <>
            <dl>
              <div><dt>Value role</dt><dd>{record.valueRole}</dd></div>
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
