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
];

test("all seven concepts have canonical Learn pages with learning identity", async () => {
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
  assert.match(sequence, /href="\/company\/aapl"/);
  assert.match(sequence, /Explore Apple/);
  assert.match(sequence, /More concepts coming/);
  assert.doesNotMatch(sequence, /Balance Sheet|EPS|P\/E/);

  for (const [slug] of canonicalLessons) {
    assert.match(catalog, new RegExp(`/learn/company-analysis/${slug}`));
  }
});

test("previous and next lesson ordering follows the approved seven-concept sequence", () => {
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
  assert.equal(getAdjacentLessons("free-cash-flow").next, null);
});

test("former company lesson routes permanently redirect to canonical Learn routes", async () => {
  const redirects = [
    ["profit", "profit"],
    ["profit-margin", "net-profit-margin"],
    ["operating-cash-flow", "operating-cash-flow"],
  ];

  for (const [oldSlug, newSlug] of redirects) {
    const page = await readSource(`app/company/aapl/${oldSlug}/page.tsx`);
    assert.match(page, /permanentRedirect/);
    assert.match(page, new RegExp(`/learn/company-analysis/${newSlug}`));
    assert.doesNotMatch(page, /getCompany|LearningJourney|LearningShell/);
  }
});

test("Explore remains company research and provides deliberate Learn links", async () => {
  const company = await readSource("app/company/aapl/page.tsx");

  assert.match(company, /Home/);
  assert.match(company, /Explore/);
  assert.match(company, /Company research/);
  assert.match(company, /href="\/learn\/company-analysis\/revenue"/);
  assert.match(company, /href="\/learn\/company-analysis\/revenue-growth"/);
  assert.doesNotMatch(company, /LearningUpNext/);
  assert.doesNotMatch(company, /id="revenue-growth"/);
});

test("desktop and mobile navigation share semantic route identity", async () => {
  const navigation = await readSource("components/app-navigation.tsx");

  assert.match(navigation, /pathname\.startsWith\("\/learn"\)/);
  assert.match(navigation, /pathname\.startsWith\("\/company\/"\)/);
  assert.match(navigation, /variant: "desktop" \| "mobile"/);
  assert.match(navigation, /aria-current=\{isCurrent \? "page"/);
});
