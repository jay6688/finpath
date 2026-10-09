"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./app-shell.module.css";

const destinations = [
  { href: "/", label: "Home", matches: (pathname: string) => pathname === "/" },
  {
    href: "/learn",
    label: "Learn",
    matches: (pathname: string) => pathname.startsWith("/learn"),
  },
  {
    href: "/explore",
    label: "Explore",
    matches: (pathname: string) =>
      pathname === "/explore" || pathname.startsWith("/company/"),
  },
];

type AppNavigationProps = {
  variant: "desktop" | "mobile";
};

export function AppNavigation({ variant }: AppNavigationProps) {
  const pathname = usePathname();

  const links = destinations.map((destination) => {
    const isCurrent = destination.matches(pathname);

    return (
      <Link
        aria-current={isCurrent ? "page" : undefined}
        href={destination.href}
        key={destination.label}
      >
        {destination.label}
      </Link>
    );
  });

  return (
    <nav
      className={`${styles.navigation} ${
        variant === "desktop" ? styles.desktopNavigation : styles.mobileNavigation
      }`}
      aria-label={variant === "desktop" ? "Primary navigation" : "Mobile navigation"}
    >
      {links}
    </nav>
  );
}
