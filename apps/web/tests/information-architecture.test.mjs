import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getAdjacentLessons } from "../src/lib/lesson-catalog.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

const canonicalLessons = [
  ["revenue", "Revenue"],
  ["revenue-growth", "Revenue Growth"],
  ["profit", "Profit / Net Income"],
  ["net-profit-margin", "Net Profit Margin"],
  ["operating-cash-flow", "Operating Cash Flow"],
  ["investing-financing-cash-flow", "Investing & Financing Cash Flow"],
  ["free-cash-flow", "Free Cash Flow"],
  ["balance-sheet", "Balance Sheet"],
  ["cash-and-debt", "Cash & Debt"],
  ["three-statements-connect", "Three Statements Connect"],
  ["eps-and-share-count", "EPS & Share Count"],
  ["market-cap", "Market Cap"],
  ["pe-ratio", "P/E Ratio"],
];

test("all thirteen concepts have canonical Learn pages with learning identity", async () => {
  const catalog = await readSource("lib/lesson-catalog.ts");

  for (const [slug, title] of canonicalLessons) {
    const page = await readSource(`app/learn/company-analysis/${slug}/page.tsx`);
    assert.match(page, new RegExp(`conceptId=["']${slug}["']`));
    assert.match(page, /<LessonShell/);
    assert.doesNotMatch(page, /Company research|Home[^]*Explore[^]*Apple Inc\./);
    assert.match(catalog, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("lesson shell expresses Learn hierarchy, ordered navigation, and Explore cross-link", async () => {
  const [shell, sequence, catalog] = await Promise.all([
    readSource("components/lesson-shell.tsx"),
    readSource("components/lesson-sequence-navigation.tsx"),
    readSource("lib/lesson-catalog.ts"),
  ]);

  assert.match(shell, /Home/);
  assert.match(shell, /href="\/learn"/);
  assert.match(shell, /Company Analysis Basics/);
  assert.match(shell, /Lesson \{lesson\.number\} of \{lessonCatalog\.length\}/);
  assert.match(sequence, /Previous lesson/);
  assert.match(sequence, /Next lesson/);
  assert.match(sequence, /selectedCompany\?\.slug \?\? "aapl"/);
  assert.match(sequence, /Explore \{selectedCompany\?\.ticker \?\? "AAPL"\}/);
  assert.match(sequence, /More concepts coming/);
  assert.doesNotMatch(sequence, /EPS|P\/E/);

  for (const [slug] of canonicalLessons) {
    assert.match(catalog, new RegExp(`/learn/company-analysis/${slug}`));
  }
});

test("previous and next lesson ordering follows the approved thirteen-concept sequence", () => {
  assert.deepEqual(getAdjacentLessons("revenue"), {
    previous: null,
    next: {
      id: "revenue-growth",
      number: 2,
      title: "Revenue Growth",
      shortGoal: "Compare annual Revenue and calculate year-over-year change.",
      href: "/learn/company-analysis/revenue-growth",
    },
  });
  assert.equal(getAdjacentLessons("profit").previous?.id, "revenue-growth");
  assert.equal(getAdjacentLessons("profit").next?.id, "net-profit-margin");
  assert.equal(getAdjacentLessons("operating-cash-flow").previous?.id, "net-profit-margin");
  assert.equal(getAdjacentLessons("operating-cash-flow").next?.id, "investing-financing-cash-flow");
  assert.equal(getAdjacentLessons("investing-financing-cash-flow").next?.id, "free-cash-flow");
  assert.equal(getAdjacentLessons("free-cash-flow").next?.id, "balance-sheet");
  assert.equal(getAdjacentLessons("balance-sheet").previous?.id, "free-cash-flow");
  assert.equal(getAdjacentLessons("balance-sheet").next?.id, "cash-and-debt");
  assert.equal(getAdjacentLessons("cash-and-debt").previous?.id, "balance-sheet");
  assert.equal(getAdjacentLessons("cash-and-debt").next?.id, "three-statements-connect");
  assert.equal(getAdjacentLessons("three-statements-connect").previous?.id, "cash-and-debt");
  assert.equal(getAdjacentLessons("three-statements-connect").next?.id, "eps-and-share-count");
  assert.equal(getAdjacentLessons("eps-and-share-count").previous?.id, "three-statements-connect");
  assert.equal(getAdjacentLessons("eps-and-share-count").next?.id, "market-cap");
  assert.equal(getAdjacentLessons("market-cap").previous?.id, "eps-and-share-count");
  assert.equal(getAdjacentLessons("market-cap").next?.id, "pe-ratio");
  assert.equal(getAdjacentLessons("pe-ratio").previous?.id, "market-cap");
  assert.equal(getAdjacentLessons("pe-ratio").next, null);
});

test("former company lesson routes permanently redirect to canonical Learn routes", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  const redirects = [
    ["profit", "profit"],
    ["profit-margin", "net-profit-margin"],
    ["operating-cash-flow", "operating-cash-flow"],
  ];

  for (const [oldSlug, newSlug] of redirects) {
    assert.match(config, new RegExp(`/company/aapl/${oldSlug}`));
    assert.match(config, new RegExp(`/learn/company-analysis/${newSlug}`));
  }
});

test("Explore remains company research and provides deliberate Learn links", async () => {
  const company = await readSource("app/company/[ticker]/page.tsx");

  assert.match(company, /Home/);
  assert.match(company, /Explore/);
  assert.match(company, /Company research/);
  assert.match(company, /\/learn\/company-analysis\/revenue\$\{selectedQuery\}/);
  assert.match(company, /\/learn\/company-analysis\/revenue-growth\$\{selectedQuery\}/);
  assert.doesNotMatch(company, /LearningUpNext/);
  assert.doesNotMatch(company, /id="revenue-growth"/);
});

test("desktop and mobile navigation share semantic route identity", async () => {
  const navigation = await readSource("components/app-navigation.tsx");

  assert.match(navigation, /pathname\.startsWith\("\/learn"\)/);
  assert.match(navigation, /pathname === "\/explore"/);
  assert.match(navigation, /pathname\.startsWith\("\/company\/"\)/);
  assert.match(navigation, /variant: "desktop" \| "mobile"/);
  assert.match(navigation, /aria-current=\{isCurrent \? "page"/);
});
