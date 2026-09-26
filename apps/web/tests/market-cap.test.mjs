import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  calculateEducationalMarketCap,
  parseEducationalPrice,
  validateSharesOutstandingForLesson,
} from "../src/lib/market-cap-learning.ts";
import {
  createDefaultLearningProgress,
  deriveCurrentConcept,
  deriveHomeRecommendation,
  markConceptsExplored,
} from "../src/lib/learning-progress.ts";
import { getAdjacentLessons, getLesson, lessonCatalog } from "../src/lib/lesson-catalog.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

const companies = {
  aapl: { slug: "aapl", ticker: "AAPL", name: "Apple Inc.", cik: "0000320193", reviewedFiscalYear: 2025 },
  msft: { slug: "msft", ticker: "MSFT", name: "Microsoft Corporation", cik: "0000789019", reviewedFiscalYear: 2026 },
  wmt: { slug: "wmt", ticker: "WMT", name: "Walmart Inc.", cik: "0000104169", reviewedFiscalYear: 2026 },
};

const contexts = {
  AAPL: ["2025-10-17", "2025-10-31", "0000320193-25-000079", 14_776_353_000],
  MSFT: ["2026-07-23", "2026-07-29", "0001193125-26-323660", 7_425_545_491],
  WMT: ["2026-03-11", "2026-03-13", "0000104169-26-000055", 7_972_402_501],
};

function sharesResponse(company = companies.aapl) {
  const [asOfDate, filedAt, accession, value] = contexts[company.ticker];
  return {
    company: { ticker: company.ticker, name: company.name, cik: company.cik },
    fact: {
      evidenceKind: "reported",
      id: "common-shares-outstanding",
      fiscalYear: company.reviewedFiscalYear,
      asOfDate,
      form: "10-K",
      filedAt,
      accession,
      sourceUrl: `https://www.sec.gov/Archives/edgar/data/${Number(company.cik)}/${accession.replaceAll("-", "")}/${accession}-index.htm`,
      taxonomyNamespace: "dei",
      taxonomyTag: "EntityCommonStockSharesOutstanding",
      taxonomyLabel: "Entity Common Stock, Shares Outstanding",
      reportedLabel: "Shares of common stock outstanding",
      value,
      unit: "shares",
    },
    dataStatus: { state: "cached", retrievedAt: "2026-09-24T00:00:00Z" },
  };
}

test("educational price parser accepts cents exactly and rejects rounding or non-decimal input", () => {
  const accepted = new Map([
    ["1", 100n],
    ["1.5", 150n],
    ["1.50", 150n],
    ["100", 10_000n],
    ["100.00", 10_000n],
    ["0.01", 1n],
    [" 12.34 ", 1_234n],
  ]);
  for (const [input, cents] of accepted) {
    assert.equal(parseEducationalPrice(input).cents, cents);
  }
  for (const input of ["", "0", "0.00", "-1", "abc", "NaN", "Infinity", "1e2", "12.345"]) {
    assert.throws(() => parseEducationalPrice(input));
  }
});

test("educational Market Cap arithmetic uses exact BigInt cents", () => {
  assert.deepEqual(calculateEducationalMarketCap(100, "12.34"), {
    priceCents: 1_234n,
    marketCapCents: 123_400n,
    exactDollars: "$1,234.00",
  });
  const expected = new Map([
    [14_776_353_000, "$1,477,635,300,000.00"],
    [7_425_545_491, "$742,554,549,100.00"],
    [7_972_402_501, "$797,240,250,100.00"],
  ]);
  for (const [shares, exactDollars] of expected) {
    assert.equal(calculateEducationalMarketCap(shares, "100.00").exactDollars, exactDollars);
  }
});

test("all three reviewed companies pass the strict shares lesson contract", () => {
  for (const company of Object.values(companies)) {
    const response = sharesResponse(company);
    assert.equal(validateSharesOutstandingForLesson(response, company), response);
  }
});

test("shares lesson contract fails closed on identity, provenance, taxonomy, unit, and value", () => {
  const cases = [];
  const wrongCompany = structuredClone(sharesResponse());
  wrongCompany.company.cik = companies.msft.cik;
  cases.push(wrongCompany);
  const wrongDate = structuredClone(sharesResponse());
  wrongDate.fact.asOfDate = "2025-10-16";
  cases.push(wrongDate);
  const wrongSource = structuredClone(sharesResponse());
  wrongSource.fact.sourceUrl = "https://example.com/not-sec";
  cases.push(wrongSource);
  const wrongTaxonomy = structuredClone(sharesResponse());
  wrongTaxonomy.fact.taxonomyTag = "WeightedAverageNumberOfSharesOutstandingBasic";
  cases.push(wrongTaxonomy);
  const wrongUnit = structuredClone(sharesResponse());
  wrongUnit.fact.unit = "USD";
  cases.push(wrongUnit);
  const unsafeValue = structuredClone(sharesResponse());
  unsafeValue.fact.value = Number.MAX_SAFE_INTEGER + 1;
  cases.push(unsafeValue);

  for (const response of cases) {
    assert.throws(() => validateSharesOutstandingForLesson(response, companies.aapl));
  }
});

test("Lesson 12 follows EPS and now continues to P/E without changing progress version", () => {
  const lesson = getLesson("market-cap");
  assert.equal(lesson.number, 12);
  assert.equal(lesson.href, "/learn/company-analysis/market-cap");
  assert.equal(lessonCatalog.length, 13);
  assert.equal(getAdjacentLessons("eps-and-share-count").next?.id, "market-cap");
  assert.equal(getAdjacentLessons("market-cap").previous?.id, "eps-and-share-count");
  assert.equal(getAdjacentLessons("market-cap").next?.id, "pe-ratio");

  let progress = createDefaultLearningProgress();
  for (const existing of lessonCatalog.slice(0, 11)) {
    progress = markConceptsExplored(progress, [existing.id]);
  }
  assert.equal(progress.version, 1);
  assert.equal(deriveCurrentConcept(progress), "market-cap");
  progress = markConceptsExplored(progress, ["market-cap"]);
  assert.equal(deriveCurrentConcept(progress), "pe-ratio");
  assert.equal(deriveHomeRecommendation(progress).conceptId, "pe-ratio");
  assert.equal(deriveHomeRecommendation(progress).action, "Continue");
});

test("Lesson 12 source keeps educational input separate from provider-backed Market Cap", async () => {
  const [page, lesson, evidence, navigation, explore] = await Promise.all([
    readSource("app/learn/company-analysis/market-cap/page.tsx"),
    readSource("components/market-cap-learning.tsx"),
    readSource("components/shares-outstanding-evidence-inspector.tsx"),
    readSource("components/lesson-sequence-navigation.tsx"),
    readSource("app/explore/page.tsx"),
  ]);
  const production = `${page}\n${lesson}`;

  assert.match(page, /capabilities\.sharesOutstanding/);
  assert.match(page, /key=/);
  assert.match(lesson, /useState\(""\)/);
  assert.match(lesson, /Try a \$100\.00 educational example/);
  assert.match(lesson, /Educational input[^]*not verified market data/i);
  assert.match(lesson, /Educational Market Cap at your price/i);
  assert.match(lesson, /not a verified market-price observation/i);
  assert.match(lesson, /point-in-time shares outstanding/i);
  assert.match(lesson, /weighted-average Basic or Diluted EPS denominator/i);
  assert.match(lesson, /price per share doubles[^]*Market Cap doubles/is);
  assert.match(lesson, /verified market price aligned to the same date/i);
  assert.match(evidence, /dei:EntityCommonStockSharesOutstanding/);
  assert.match(evidence, /Open SEC filing index/);
  assert.match(navigation, /"market-cap"/);
  assert.doesNotMatch(production, /Marketstack|MARKETSTACK_ACCESS_KEY|MarketPriceSnapshot|derive_market_cap_snapshot|MARKET_DATA_PUBLIC_DISPLAY_APPROVED/);
  assert.doesNotMatch(production, /\/market-data|\/market-price/);
  assert.doesNotMatch(production, /P\/E|Forward P\/E/i);
  assert.doesNotMatch(production, /parseFloat|Number\([^)]*\)\s*\*|\*\s*Number\(/);
  assert.doesNotMatch(explore, /Market Cap[^]*\$|market price/i);
});

test("React lesson source contains no hard-coded company share-count or stock-price fallback", async () => {
  const sources = await Promise.all([
    readSource("components/market-cap-learning.tsx"),
    readSource("components/shares-outstanding-evidence-inspector.tsx"),
    readSource("app/learn/company-analysis/market-cap/page.tsx"),
  ]);
  const combined = sources.join("\n");
  assert.doesNotMatch(combined, /14776353000|7425545491|7972402501/);
  assert.doesNotMatch(combined, /current Market Cap|historical Market Cap|actual Market Cap/i);
});
