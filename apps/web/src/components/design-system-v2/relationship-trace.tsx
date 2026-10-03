import styles from "./relationship-trace.module.css";

export function RelationshipTrace({ sourceLabel, destinationLabel, label }: { sourceLabel: string; destinationLabel: string; label: string }) {
  return (
    <div className={styles.trace} role="group" aria-label={`${sourceLabel} to ${destinationLabel}: ${label}`}>
      <span className={styles.endpoints}><strong>{sourceLabel}</strong><i aria-hidden="true">→</i><strong>{destinationLabel}</strong></span>
      <span className={styles.line} aria-hidden="true" />
      <span className={styles.annotation}>{label}</span>
    </div>
  );
}
