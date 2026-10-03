"use client";

import { useId, useMemo } from "react";

import { FinancialObject } from "./financial-object";
import { RelationshipTrace } from "./relationship-trace";
import styles from "./concept-lens.module.css";
import type { FinancialObjectDatum, FinancialObjectKind, RelationshipDatum } from "./types";

export function ConceptLens({ objects, relationships, selectedId, onSelect, learnHrefByObject, exploreHref }: {
  objects: FinancialObjectDatum[];
  relationships: RelationshipDatum[];
  selectedId: FinancialObjectKind;
  onSelect: (id: FinancialObjectKind) => void;
  learnHrefByObject?: Partial<Record<FinancialObjectKind, string>>;
  exploreHref?: string;
}) {
  const headingId = useId();
  const selected = objects.find((object) => object.id === selectedId);
  const neighbours = useMemo(() => {
    const ids = relationships.flatMap((relationship) => relationship.from === selectedId ? [relationship.to] : relationship.to === selectedId ? [relationship.from] : []);
    return [...new Set(ids)].map((id) => objects.find((object) => object.id === id)).filter((object): object is FinancialObjectDatum => Boolean(object));
  }, [objects, relationships, selectedId]);

  if (!selected) throw new RangeError(`ConceptLens selectedId ${selectedId} is not present in objects`);

  return (
    <section className={styles.lens} aria-labelledby={headingId}>
      <header><p>Financial system</p><h2 id={headingId}><span>Focus:</span> {selected.label}</h2><p>{selected.summary}</p></header>
      <div className={styles.relationships}>
        <div className={styles.focusObject}><FinancialObject object={selected} selected /></div>
        <RelationshipTrace label={`${selected.label} connects to ${neighbours.map((item) => item.label).join(", ")}`} />
        <div className={styles.neighbours} role="list" aria-label={`Concepts connected to ${selected.label}`}>
          {neighbours.map((object) => (
            <div key={object.id} role="listitem">
              <button type="button" onClick={() => onSelect(object.id)} disabled={object.unavailable}>
                <FinancialObject object={object} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <footer>
        <p><span>Connected to:</span> {neighbours.map((item) => item.label).join(" · ")}</p>
        <nav aria-label={`${selected.label} actions`}>
          {learnHrefByObject?.[selectedId] ? <a href={learnHrefByObject[selectedId]}>Learn {selected.label}</a> : null}
          {exploreHref ? <a href={exploreHref}>Explore with a company</a> : null}
        </nav>
      </footer>
    </section>
  );
}
