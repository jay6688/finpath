import type { ReactNode } from "react";

import styles from "./relationship-trace.module.css";

export function RelationshipTrace({ label, children, direction = "horizontal" }: { label: string; children?: ReactNode; direction?: "horizontal" | "vertical" }) {
  return (
    <div className={styles.trace} data-direction={direction} role="group" aria-label={label}>
      <span className={styles.line} aria-hidden="true"><i /></span>
      {children ? <span className={styles.annotation}>{children}</span> : null}
    </div>
  );
}
