import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppNavigation } from "@/components/app-navigation";
import { FinPathMark } from "@/components/finpath-mark";
import { LearningProgressProvider } from "@/components/learning-progress-provider";

import styles from "./app-shell.module.css";

import "@/styles/visual-system.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FinPath",
    template: "%s · FinPath",
  },
  description: "Understand money and investing through real companies and clear explanations.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={styles.body}>
        <a className={styles.skipLink} href="#main-content">
          Skip to content
        </a>
        <LearningProgressProvider>
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Link className={styles.brand} href="/" aria-label="FinPath home">
                <FinPathMark className={styles.brandMark} />
                <span>FinPath</span>
              </Link>
              <AppNavigation variant="desktop" />
              <span className={styles.context}>Financial learning · traceable evidence</span>
            </div>
          </header>
          <main className={styles.main} id="main-content" tabIndex={-1}>
            {children}
          </main>
          <AppNavigation variant="mobile" />
        </LearningProgressProvider>
      </body>
    </html>
  );
}
