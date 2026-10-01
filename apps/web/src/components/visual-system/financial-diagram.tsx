import type { CSSProperties, ReactNode } from "react";
import { useId } from "react";

import styles from "./financial-diagram.module.css";

export type DiagramCategory =
  | "revenue"
  | "cost"
  | "expense"
  | "adjustment"
  | "subtotal"
  | "final";

export function FinancialDiagram({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <figure className={styles.diagram} aria-labelledby={titleId} aria-describedby={descriptionId}>
      <figcaption>
        <strong id={titleId}>{title}</strong>
        <span id={descriptionId}>{description}</span>
      </figcaption>
      <div className={styles.plot}>{children}</div>
    </figure>
  );
}

export function DiagramMagnitude({
  label,
  displayValue,
  magnitudePercent,
  category,
  state = "revealed",
}: {
  label: string;
  displayValue: string;
  magnitudePercent: number;
  category: DiagramCategory;
  state?: "pending" | "current" | "revealed";
}) {
  if (!Number.isFinite(magnitudePercent) || magnitudePercent < 0 || magnitudePercent > 100) {
    throw new RangeError("magnitudePercent must be a validated value from 0 to 100");
  }

  const style = { "--fp-diagram-magnitude": magnitudePercent } as CSSProperties;

  return (
    <div className={styles.magnitude} data-category={category} data-state={state} style={style}>
      <span className={styles.bar} aria-hidden="true" />
      <span className={styles.magnitudeLabel}>{label}</span>
      <strong>{displayValue}</strong>
    </div>
  );
}

export function ConceptNode({
  title,
  description,
  state = "available",
}: {
  title: string;
  description: string;
  state?: "complete" | "current" | "available" | "future";
}) {
  return (
    <div className={styles.conceptNode} data-state={state}>
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

export function ConceptConnector({
  label,
  direction = "vertical",
}: {
  label: string;
  direction?: "horizontal" | "vertical";
}) {
  return (
    <div className={styles.connector} data-direction={direction}>
      <span className={styles.srOnly}>{label}</span>
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M12 3v16m-5-5 5 5 5-5" />
      </svg>
    </div>
  );
}
