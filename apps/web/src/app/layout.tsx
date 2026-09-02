import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppNavigation } from "@/components/app-navigation";
import { LearningProgressProvider } from "@/components/learning-progress-provider";

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
          <header className="site-header">
            <div className="site-header__inner">
              <Link className="brand" href="/" aria-label="FinPath home">
                <span className="brand__mark" aria-hidden="true">
                  F
                </span>
                <span>FinPath</span>
              </Link>
              <AppNavigation variant="desktop" />
              <span className="shell-note">Learn with real financial records</span>
            </div>
          </header>
          <main id="main-content">{children}</main>
          <AppNavigation variant="mobile" />
        </LearningProgressProvider>
      </body>
    </html>
  );
}
