import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./reconcept.module.css";

type LabSection = "home" | "learn" | "explore";

const routes = [
  { id: "home", label: "Home", href: "/design-lab/reconcept" },
  { id: "learn", label: "Learn", href: "/design-lab/reconcept/profit" },
  { id: "explore", label: "Explore", href: "/design-lab/reconcept/apple" },
] as const;

export function ReconceptShell({
  active,
  children,
  mode,
}: {
  active: LabSection;
  children: ReactNode;
  mode: "atlas" | "learn" | "research";
}) {
  return (
    <div className={styles.labRoot} data-mode={mode} data-reconcept-root>
      <a className={styles.labSkipLink} href="#reconcept-main">Skip to prototype content</a>
      <header className={styles.labHeader}>
        <Link className={styles.labBrand} href="/design-lab/reconcept" aria-label="FinPath re-concept home">
          <svg aria-hidden="true" viewBox="0 0 36 36">
            <path d="M6 19C6 10.5 11.8 5 21 4.5 20.5 13.5 15.2 18.7 6 19Z" />
            <path d="M13 31c.2-8.4 5.8-13.8 16-14.4-.4 9.3-5.8 14.1-16 14.4Z" />
          </svg>
          <span>FinPath</span>
        </Link>
        <nav className={styles.labNav} aria-label="Re-concept prototype">
          {routes.map((route) => (
            <Link aria-current={active === route.id ? "page" : undefined} href={route.href} key={route.id}>
              {route.label}
            </Link>
          ))}
        </nav>
        <div className={styles.labStatus}>
          <span>Design lab</span>
          <Link href="/">Current product ↗</Link>
        </div>
      </header>
      <main className={styles.labMain} id="reconcept-main">{children}</main>
      <nav className={styles.labMobileNav} aria-label="Re-concept mobile navigation">
        {routes.map((route) => (
          <Link aria-current={active === route.id ? "page" : undefined} href={route.href} key={route.id}>
            <span aria-hidden="true">{route.id === "home" ? "⌂" : route.id === "learn" ? "◇" : "◎"}</span>
            {route.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
