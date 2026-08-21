"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const destinations = [
  { href: "/", label: "Home", matches: (pathname: string) => pathname === "/" },
  {
    href: "/company/aapl",
    label: "Explore",
    matches: (pathname: string) => pathname.startsWith("/company/"),
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
      className={variant === "desktop" ? "desktop-navigation" : "mobile-navigation"}
      aria-label={variant === "desktop" ? "Primary navigation" : "Mobile navigation"}
    >
      {links}
    </nav>
  );
}
