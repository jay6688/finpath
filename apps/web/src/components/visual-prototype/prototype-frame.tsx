import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./visual-prototype.module.css";

type PrototypeSection = "home" | "learn" | "explore";

type PrototypeFrameProps = {
  active: PrototypeSection;
  children: ReactNode;
  tone: "home" | "learn" | "explore";
};

const destinations: Array<{
  href: string;
  id: PrototypeSection;
  label: string;
}> = [
  { href: "/prototype/visual-redesign", id: "home", label: "Home" },
  {
    href: "/prototype/visual-redesign/profit",
    id: "learn",
    label: "Learn",
  },
  {
    href: "/prototype/visual-redesign/apple",
    id: "explore",
    label: "Explore",
  },
];

function FinPathMark() {
  return (
    <svg
      aria-hidden="true"
      className={styles.brandMark}
      viewBox="0 0 32 32"
    >
      <path d="M6 18C6 10 11 5 19 4c0 8-5 13-13 14Z" />
      <path d="M12 27c0-8 5-13 14-14 0 8-5 13-14 14Z" />
    </svg>
  );
}

export function PrototypeFrame({
  active,
  children,
  tone,
}: PrototypeFrameProps) {
  return (
    <div
      className={`finpath-stage-zero ${styles.prototypeRoot}`}
      data-tone={tone}
    >
      <header className={styles.prototypeHeader}>
        <div className={styles.headerInner}>
          <Link
            aria-label="FinPath Stage 0 prototype home"
            className={styles.prototypeBrand}
            href="/prototype/visual-redesign"
          >
            <FinPathMark />
            <span>FinPath</span>
          </Link>

          <nav className={styles.prototypeNav} aria-label="Stage 0 prototype">
            {destinations.map((destination) => (
              <Link
                aria-current={active === destination.id ? "page" : undefined}
                href={destination.href}
                key={destination.id}
              >
                {destination.label}
              </Link>
            ))}
          </nav>

          <div className={styles.headerContext}>
            <span>Stage 0 visual prototype</span>
            <Link href="/">Current FinPath</Link>
          </div>
        </div>
      </header>

      <div className={styles.prototypeMain}>{children}</div>

      <footer className={styles.prototypeFooter}>
        <p>
          Local visual prototype. Financial content still comes from FinPath&apos;s
          reviewed data contracts.
        </p>
        <Link href="/">Return to current FinPath</Link>
      </footer>
    </div>
  );
}
