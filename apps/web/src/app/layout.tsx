import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppNavigation } from "@/components/app-navigation";
import shellStyles from "@/components/app-shell.module.css";
import { LearningProgressProvider } from "@/components/learning-progress-provider";

import "@/styles/visual-system-v2.css";
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
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <LearningProgressProvider>
          <header className={shellStyles.header}>
            <div className={shellStyles.headerInner}>
              <Link className={shellStyles.brand} href="/" aria-label="FinPath home">
                <span className={shellStyles.brandMark} aria-hidden="true">
                  F
                </span>
                <span>FinPath</span>
              </Link>
              <AppNavigation variant="desktop" />
              <span className={shellStyles.shellNote}>Real companies · connected records</span>
            </div>
          </header>
          <main className={shellStyles.main} id="main-content" tabIndex={-1}>{children}</main>
          <AppNavigation variant="mobile" />
        </LearningProgressProvider>
      </body>
    </html>
  );
}
