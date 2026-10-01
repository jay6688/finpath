import type { ReactNode } from "react";

import styles from "./page-mode-shell.module.css";

export type PageMode = "learn" | "research" | "evidence" | "sandbox";

type PageModeShellProps = {
  mode: PageMode;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
};

export function PageModeShell({ mode, children, className, labelledBy }: PageModeShellProps) {
  const classes = [styles.shell, styles[mode], className].filter(Boolean).join(" ");

  return (
    <div className={classes} data-finpath-mode={mode} aria-labelledby={labelledBy}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
