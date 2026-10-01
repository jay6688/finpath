import type { ReactNode } from "react";

import styles from "./financial-equation.module.css";

export function FinancialEquation({
  accessibleLabel,
  children,
}: {
  accessibleLabel: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.equation} role="group" aria-label={accessibleLabel}>
      {children}
    </div>
  );
}

export function FinancialEquationStep({
  label,
  value,
  role,
}: {
  label: string;
  value: string;
  role: "reported" | "derived" | "learner-input";
}) {
  return (
    <div className={styles.step} data-equation-role={role}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function FinancialEquationOperator({ children }: { children: ReactNode }) {
  return (
    <span className={styles.operator} aria-hidden="true">
      {children}
    </span>
  );
}
