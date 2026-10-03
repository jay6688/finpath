"use client";

import { useId, useMemo } from "react";

import { FinancialObject } from "./financial-object";
import { getFocusedRelationships } from "./relationship-model";
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
  const focusedRelationships = useMemo(
    () => getFocusedRelationships(relationships, selectedId),
    [relationships, selectedId],
  );

  if (!selected) throw new RangeError(`ConceptLens selectedId ${selectedId} is not present in objects`);

  return (
    <section className={styles.lens} aria-labelledby={headingId}>
      <header><p>Financial system</p><h2 id={headingId}><span>Focus:</span> {selected.label}</h2><p>{selected.summary}</p></header>
      <div className={styles.relationships}>
        <div className={styles.focusObject}><FinancialObject object={selected} selected /></div>
        <div className={styles.connections} role="list" aria-label={`Directed relationships connected to ${selected.label}`}>
          {focusedRelationships.map((relationship, index) => {
            const object = objects.find((item) => item.id === relationship.counterpart);
            if (!object) return null;
            const source = objects.find((item) => item.id === relationship.from);
            const destination = objects.find((item) => item.id === relationship.to);
            if (!source || !destination) return null;
            return (
              <div className={styles.connection} key={`${relationship.from}-${relationship.to}-${relationship.label}-${index}`} role="listitem">
                <RelationshipTrace sourceLabel={source.label} destinationLabel={destination.label} label={relationship.label} />
                <button type="button" onClick={() => onSelect(object.id)} disabled={object.unavailable}>
                  <FinancialObject object={object} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <footer>
        <p><span>Connected relationships:</span> {focusedRelationships.length}</p>
        <nav aria-label={`${selected.label} actions`}>
          {learnHrefByObject?.[selectedId] ? <a href={learnHrefByObject[selectedId]}>Learn {selected.label}</a> : null}
          {exploreHref ? <a href={exploreHref}>Explore with a company</a> : null}
        </nav>
      </footer>
    </section>
  );
}
