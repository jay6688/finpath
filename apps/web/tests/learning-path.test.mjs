import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createDefaultLearningProgress,
  deriveConceptState,
  deriveCurrentConcept,
  deriveHomeRecommendation,
  deriveUpNextModel,
  LEARNING_PROGRESS_STORAGE_KEY,
  markConceptsExplored,
  markRevenueMilestoneExplored,
  readLearningProgress,
  writeLearningProgress,
} from "../src/lib/learning-progress.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("a fresh browser starts honestly at the grouped Revenue milestone", () => {
  const progress = readLearningProgress(memoryStorage());

  assert.deepEqual(progress, createDefaultLearningProgress());
  assert.equal(deriveCurrentConcept(progress), "revenue");
  assert.equal(deriveConceptState("revenue", progress), "current");
  assert.equal(deriveConceptState("revenue-growth", progress), "current");
  assert.equal(deriveConceptState("profit", progress), "available");
  assert.equal(deriveHomeRecommendation(progress).action, "Start");
});

test("device-local progress writes and reads only versioned concept IDs", () => {
  const storage = memoryStorage();
  const progress = markRevenueMilestoneExplored(createDefaultLearningProgress());

  assert.equal(writeLearningProgress(storage, progress), true);
  assert.deepEqual(readLearningProgress(storage), {
    version: 1,
    exploredConceptIds: ["revenue", "revenue-growth"],
  });

  const serialized = storage.getItem(LEARNING_PROGRESS_STORAGE_KEY);
  assert.doesNotMatch(serialized, /416|Revenue value|SEC/i);
});

test("malformed, old-version, and unavailable storage fail to the honest default", () => {
  const malformed = memoryStorage({ [LEARNING_PROGRESS_STORAGE_KEY]: "{not-json" });
  const oldVersion = memoryStorage({
    [LEARNING_PROGRESS_STORAGE_KEY]: JSON.stringify({
      version: 0,
      exploredConceptIds: ["profit"],
    }),
  });
  const throwingStorage = {
    getItem() {
      throw new Error("storage disabled");
    },
    setItem() {
      throw new Error("storage disabled");
    },
  };

  assert.deepEqual(readLearningProgress(malformed), createDefaultLearningProgress());
  assert.deepEqual(readLearningProgress(oldVersion), createDefaultLearningProgress());
  assert.deepEqual(readLearningProgress(throwingStorage), createDefaultLearningProgress());
  assert.equal(writeLearningProgress(throwingStorage, createDefaultLearningProgress()), false);

  const incompleteRevenue = memoryStorage({
    [LEARNING_PROGRESS_STORAGE_KEY]: JSON.stringify({
      version: 1,
      exploredConceptIds: ["revenue", "unknown-concept"],
    }),
  });
  assert.deepEqual(readLearningProgress(incompleteRevenue), createDefaultLearningProgress());
});

test("current is always the first recommended milestone not yet explored", () => {
  const revenue = markRevenueMilestoneExplored(createDefaultLearningProgress());
  const profit = markConceptsExplored(revenue, ["profit"]);
  const all = markConceptsExplored(profit, ["net-profit-margin"]);

  assert.equal(deriveCurrentConcept(revenue), "profit");
  assert.equal(deriveCurrentConcept(profit), "net-profit-margin");
  assert.equal(deriveCurrentConcept(all), null);
  assert.equal(deriveHomeRecommendation(all).action, "Review");
});

test("using a future lesson never invents earlier progress", () => {
  const futureFirst = markConceptsExplored(createDefaultLearningProgress(), [
    "net-profit-margin",
  ]);

  assert.deepEqual(futureFirst.exploredConceptIds, ["net-profit-margin"]);
  assert.equal(deriveCurrentConcept(futureFirst), "revenue");
  assert.equal(deriveHomeRecommendation(futureFirst).action, "Start");
  assert.equal(deriveConceptState("profit", futureFirst), "available");
  assert.equal(deriveConceptState("net-profit-margin", futureFirst), "explored");
});

test("Revenue and Revenue Growth use one defensible completion trigger", async () => {
  const [explorer, insight] = await Promise.all([
    readSource("components/revenue-growth-explorer.tsx"),
    readSource("components/revenue-history-insight.tsx"),
  ]);
  const progress = markRevenueMilestoneExplored(createDefaultLearningProgress());

  assert.deepEqual(progress.exploredConceptIds, ["revenue", "revenue-growth"]);
  assert.match(explorer, /id="revenue-growth"/);
  assert.match(explorer, /markExplored\(\["revenue", "revenue-growth"\]\)/);
  assert.match(insight, /markExplored\(\["revenue", "revenue-growth"\]\)/);
  assert.doesNotMatch(explorer, /useEffect\([^]*markExplored/);
});

test("Profit and Net Profit Margin record meaningful use without requiring correctness", async () => {
  const [profit, margin] = await Promise.all([
    readSource("components/profit-learning-journey.tsx"),
    readSource("components/profit-margin-learning.tsx"),
  ]);

  assert.match(profit, /stageIndex === stages\.length - 1[^]*markExplored\(\["profit"\]\)/);
  assert.match(profit, /nextIndex === stages\.length - 1[^]*markExplored\(\["profit"\]\)/);
  assert.match(margin, /if \(selectedChoice\)[^]*markExplored\(\["net-profit-margin"\]\)/);
  assert.doesNotMatch(margin, /if \(supportedAnswer\)[^]*markExplored/);
});

test("Up Next is quiet before use, stronger after use, and never invents a final lesson", () => {
  const fresh = createDefaultLearningProgress();
  const before = deriveUpNextModel("revenue-growth", fresh);
  const after = deriveUpNextModel(
    "revenue-growth",
    markRevenueMilestoneExplored(fresh),
  );
  const final = deriveUpNextModel("net-profit-margin", fresh);

  assert.equal(before.emphasis, "quiet");
  assert.equal(before.action, "Open now");
  assert.equal(after.emphasis, "strong");
  assert.equal(after.action, "Continue");
  assert.equal(final.kind, "coming-later");
  assert.equal(final.href, "/learn");
  assert.doesNotMatch(JSON.stringify(final), /cash flow|EPS|valuation/i);
});

test("Home and Learn expose derived states, real routes, and no fabricated duration", async () => {
  const [home, path, navigation, upNext] = await Promise.all([
    readSource("components/learning-home.tsx"),
    readSource("components/learning-path-view.tsx"),
    readSource("components/app-navigation.tsx"),
    readSource("components/learning-up-next.tsx"),
  ]);

  assert.match(home, /deriveHomeRecommendation\(progress\)/);
  assert.match(path, /aria-current=\{revenueState === "current" \? "step"/);
  assert.match(path, /\/company\/aapl#revenue-growth/);
  assert.match(path, /actionLabel\(revenueState, revenueState === "current"\)/);
  assert.match(path, /More concepts coming/);
  assert.doesNotMatch(path, /href=.*More concepts coming/);
  assert.match(navigation, /href: "\/learn"/);
  assert.match(upNext, /deriveUpNextModel/);
  assert.doesNotMatch(`${home}${path}${upNext}`, /\b(?:minute|minutes|min)\b/i);
});
