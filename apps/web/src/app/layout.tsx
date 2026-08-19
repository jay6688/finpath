import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

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
        <header className="site-header">
          <div className="site-header__inner">
            <Link className="brand" href="/" aria-label="FinPath home">
              <span className="brand__mark" aria-hidden="true">
                F
              </span>
              <span>FinPath</span>
            </Link>
            <span className="v0-label">V0 · Apple first</span>
          </div>
        </header>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}

