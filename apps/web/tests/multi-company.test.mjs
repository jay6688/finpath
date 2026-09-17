import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveCompanyQuery } from "../src/lib/company-selection.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

const companies = [
  { slug: "aapl", ticker: "AAPL", name: "Apple Inc." },
  { slug: "msft", ticker: "MSFT", name: "Microsoft Corporation" },
  { slug: "wmt", ticker: "WMT", name: "Walmart Inc." },
];

test("company query selection is durable and invalid values fall back safely", () => {
  assert.equal(resolveCompanyQuery("msft", companies).ticker, "MSFT");
  assert.equal(resolveCompanyQuery("WMT", companies).ticker, "WMT");
  assert.equal(resolveCompanyQuery(undefined, companies).ticker, "AAPL");
  assert.equal(resolveCompanyQuery(["msft", "wmt"], companies).ticker, "AAPL");
  assert.equal(resolveCompanyQuery("nvda", companies).ticker, "AAPL");
});

test("Explore and company research are one reusable three-company architecture", async () => {
  const [explore, companyPage, api, navigation] = await Promise.all([
    readSource("app/explore/page.tsx"),
    readSource("app/company/[ticker]/page.tsx"),
    readSource("lib/api.ts"),
    readSource("components/app-navigation.tsx"),
  ]);

  assert.match(explore, /getSupportedCompanies/);
  assert.match(explore, /Research a real company/);
  assert.match(companyPage, /getCompanyRevenueData/);
  assert.match(companyPage, /available reviewed financial data/i);
  assert.match(api, /\/v1\/companies`/);
  assert.match(navigation, /href: "\/explore"/);
  assert.match(navigation, /pathname === "\/explore"/);
  assert.match(navigation, /pathname\.startsWith\("\/company\/"\)/);
});

test("Revenue lessons use URL-backed company selection without forking progress", async () => {
  const [revenuePage, growthPage, selector, progress] = await Promise.all([
    readSource("app/learn/company-analysis/revenue/page.tsx"),
    readSource("app/learn/company-analysis/revenue-growth/page.tsx"),
    readSource("components/company-example-selector.tsx"),
    readSource("lib/learning-progress.ts"),
  ]);

  for (const page of [revenuePage, growthPage]) {
    assert.match(page, /searchParams/);
    assert.match(page, /company/);
    assert.match(page, /CompanyExampleSelector/);
    assert.doesNotMatch(page, /getAppleRevenueData/);
  }
  assert.match(selector, /router\.push/);
  assert.match(selector, /URLSearchParams/);
  assert.doesNotMatch(progress, /selectedCompany|companyTicker|AAPL|MSFT|WMT/);
});

test("company-specific financial values are not hard-coded in React source", async () => {
  const sources = await Promise.all([
    readSource("app/explore/page.tsx"),
    readSource("app/company/[ticker]/page.tsx"),
    readSource("components/company-example-selector.tsx"),
    readSource("lib/company-revenue-data.ts"),
  ]);

  for (const source of sources) {
    assert.doesNotMatch(source, /416161000000|331839000000|713163000000/);
  }
});
