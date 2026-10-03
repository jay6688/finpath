import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getLessonChapter,
  lessonChapters,
} from "../src/lib/lesson-chapters.ts";
import { lessonCatalog } from "../src/lib/lesson-catalog.ts";
import {
  conceptIds,
  createDefaultLearningProgress,
  deriveHomeRecommendation,
  markConceptsExplored,
} from "../src/lib/learning-progress.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

const expectedChapters = [
  ["Understand the business", ["revenue", "revenue-growth", "profit", "net-profit-margin"]],
  ["Follow the cash", ["operating-cash-flow", "investing-financing-cash-flow", "free-cash-flow"]],
  ["Understand the position", ["balance-sheet", "cash-and-debt", "three-statements-connect"]],
  ["Think per share", ["eps-and-share-count"]],
  ["Value the company", ["market-cap", "pe-ratio"]],
  ["Understand the business model", ["business-model"]],
  ["Put it together", ["capstone"]],
];

test("chapter grouping presents every canonical lesson exactly once and in order", () => {
  assert.deepEqual(
    lessonChapters.map((chapter) => [
      chapter.title,
      chapter.lessons.map((lesson) => lesson.id),
    ]),
    expectedChapters,
  );

  const groupedIds = lessonChapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => lesson.id),
  );
  assert.deepEqual(groupedIds, lessonCatalog.map((lesson) => lesson.id));
  assert.equal(new Set(groupedIds).size, 15);
  assert.equal(getLessonChapter("profit").id, "understand-the-business");
  assert.equal(getLessonChapter("capstone").id, "put-it-together");
});

test("fresh, partial, and complete Learn recommendations keep production semantics", () => {
  const fresh = createDefaultLearningProgress();
  const partial = markConceptsExplored(fresh, ["revenue", "revenue-growth"]);
  const complete = markConceptsExplored(fresh, conceptIds);

  assert.deepEqual(
    [deriveHomeRecommendation(fresh).conceptId, deriveHomeRecommendation(fresh).action],
    ["revenue", "Start"],
  );
  assert.deepEqual(
    [deriveHomeRecommendation(partial).conceptId, deriveHomeRecommendation(partial).action],
    ["profit", "Continue"],
  );
  assert.deepEqual(
    [deriveHomeRecommendation(complete).conceptId, deriveHomeRecommendation(complete).action],
    ["capstone", "Review"],
  );
});

test("Learn landing uses chapters, semantic progress, and canonical routes without gamification", async () => {
  const [landing, styles] = await Promise.all([
    readSource("components/learning-path-view.tsx"),
    readSource("components/learning-path-view.module.css"),
  ]);

  assert.match(landing, /lessonChapters\.map/);
  assert.match(landing, /deriveHomeRecommendation\(progress\)/);
  assert.match(landing, /<progress/);
  assert.match(landing, /aria-current=\{state === "current" \? "step"/);
  assert.match(landing, /Review Capstone/);
  assert.match(landing, /Guided understanding/);
  assert.match(styles, /@media \(min-width: 48rem\)/);
  assert.match(styles, /@media \(min-width: 75rem\)/);
  assert.doesNotMatch(`${landing}\n${styles}`, /\b(?:XP|streak|badge|level)\b/i);
  assert.doesNotMatch(landing, /href=["'`]\/learn\/chapter/);

  const renderedHrefs = lessonChapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => lesson.href),
  );
  assert.deepEqual(renderedHrefs, lessonCatalog.map((lesson) => lesson.href));
});

test("shared lesson chrome keeps one lesson H1 and frames untouched legacy bodies", async () => {
  const [shell, progress, sequence, chromeStyles] = await Promise.all([
    readSource("components/lesson-shell.tsx"),
    readSource("components/lesson-progress-summary.tsx"),
    readSource("components/lesson-sequence-navigation.tsx"),
    readSource("components/lesson-chrome.module.css"),
  ]);

  assert.equal((shell.match(/<h1/g) ?? []).length, 1);
  assert.match(shell, /href="\/learn"/);
  assert.match(shell, /getLessonChapter\(conceptId\)/);
  assert.match(shell, /Lesson \{lesson\.number\} of \{lessonCatalog\.length\}/);
  assert.match(shell, /<LessonProgressSummary/);
  assert.match(progress, /useLearningProgress/);
  assert.match(progress, /<progress/);
  assert.match(sequence, /getAdjacentLessons\(currentConceptId\)/);
  assert.match(sequence, /markExplored\(\[currentConceptId\]\)/);
  assert.match(chromeStyles, /var\(--fp-v2-/);
  assert.doesNotMatch(
    `${shell}\n${progress}\n${sequence}`,
    /MetricDossier|NumberPassport|QuantitativeLedger/,
  );
});

test("representative lesson routes retain their legacy body components", async () => {
  const representativeBodies = [
    ["revenue", "RevenueLessonContent"],
    ["profit", "ProfitLearningJourney"],
    ["balance-sheet", "BalanceSheetLearning"],
    ["market-cap", "MarketCapLearning"],
    ["capstone", "CapstoneLearning"],
  ];

  for (const [slug, bodyComponent] of representativeBodies) {
    const page = await readSource(`app/learn/company-analysis/${slug}/page.tsx`);
    assert.match(page, /<LessonShell/);
    assert.match(page, new RegExp(`<${bodyComponent}`));
  }
});

test("Learn and Explore remain distinct modes without changing route identity", async () => {
  const [navigation, landing] = await Promise.all([
    readSource("components/app-navigation.tsx"),
    readSource("components/learning-path-view.tsx"),
  ]);

  assert.match(navigation, /pathname\.startsWith\("\/learn"\)/);
  assert.match(navigation, /pathname === "\/explore"/);
  assert.match(landing, /Guided understanding/);
  assert.match(landing, /Research stays separate/);
  assert.doesNotMatch(landing, /Passport|research density/i);
});
