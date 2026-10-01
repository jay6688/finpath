import type { ReactNode } from "react";

import styles from "./content-primitives.module.css";

export type EvidenceRole =
  | "reported"
  | "derived"
  | "narrative"
  | "verification"
  | "learner-input"
  | "unknown";

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

type MetricValueProps = {
  label: string;
  value: string;
  supportingText?: string;
  role?: EvidenceRole;
};

export function MetricValue({ label, value, supportingText, role = "unknown" }: MetricValueProps) {
  return (
    <div className={styles.metric} data-evidence-role={role}>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={styles.metricValue}>{value}</strong>
      {supportingText ? <span className={styles.metricSupport}>{supportingText}</span> : null}
    </div>
  );
}

export function ReportedValue(props: Omit<MetricValueProps, "role">) {
  return <MetricValue {...props} role="reported" />;
}

export function DerivedValue(props: Omit<MetricValueProps, "role">) {
  return <MetricValue {...props} role="derived" />;
}

export function EvidenceAnchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className={styles.evidenceAnchor} href={href} target="_blank" rel="noreferrer">
      {children}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

export function LearningAnnotation({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <aside className={styles.annotation}>
      <p className={styles.annotationHeading}>{heading}</p>
      <div>{children}</div>
    </aside>
  );
}

export function EducationalSandboxSurface({
  heading,
  boundary,
  children,
}: {
  heading: string;
  boundary: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.sandbox} aria-label={heading}>
      <div className={styles.sandboxHeading}>
        <SectionEyebrow>Learning Sandbox</SectionEyebrow>
        <h2>{heading}</h2>
      </div>
      {children}
      <p className={styles.sandboxBoundary}>{boundary}</p>
    </section>
  );
}

export function ResearchSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.researchSection}>
      {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
