import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  conceptIds,
  createPendingLearningProgressState,
  deriveHomeRecommendation,
  getBrowserStorage,
  LEARNING_PROGRESS_STORAGE_KEY,
  resolveLearningProgressState,
} from "../src/lib/learning-progress.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

function memoryStorage(exploredConceptIds = []) {
  return {
    getItem(key) {
      if (key !== LEARNING_PROGRESS_STORAGE_KEY) return null;
      return exploredConceptIds.length === 0
        ? null
        : JSON.stringify({ version: 1, exploredConceptIds });
    },
  };
}

test("unknown progress is distinct from a hydrated fresh learner", () => {
  const pending = createPendingLearningProgressState();
  const fresh = resolveLearningProgressState(memoryStorage());

  assert.deepEqual(pending, { isHydrated: false, progress: null });
  assert.equal(fresh.isHydrated, true);
  assert.deepEqual(fresh.progress.exploredConceptIds, []);
  assert.deepEqual(
    [deriveHomeRecommendation(fresh.progress).conceptId, deriveHomeRecommendation(fresh.progress).action],
    ["revenue", "Start"],
  );
});

test("hydrated partial and complete progress keep the canonical recommendation and count", () => {
  const partial = resolveLearningProgressState(memoryStorage(["revenue", "revenue-growth"]));
  const complete = resolveLearningProgressState(memoryStorage(conceptIds));

  assert.equal(partial.isHydrated, true);
  assert.deepEqual(
    [partial.progress.exploredConceptIds.length, deriveHomeRecommendation(partial.progress).conceptId],
    [2, "profit"],
  );
  assert.equal(deriveHomeRecommendation(partial.progress).action, "Continue");

  assert.equal(complete.isHydrated, true);
  assert.deepEqual(
    [complete.progress.exploredConceptIds.length, deriveHomeRecommendation(complete.progress).conceptId],
    [15, "capstone"],
  );
  assert.equal(deriveHomeRecommendation(complete.progress).action, "Review");
});

test("blocked localStorage resolves to the honest default only after the read attempt", () => {
  const blockedWindow = {};
  Object.defineProperty(blockedWindow, "localStorage", {
    get() {
      throw new DOMException("Access denied", "SecurityError");
    },
  });

  const pending = createPendingLearningProgressState();
  const resolved = resolveLearningProgressState(getBrowserStorage(blockedWindow));

  assert.equal(pending.isHydrated, false);
  assert.equal(resolved.isHydrated, true);
  assert.deepEqual(resolved.progress.exploredConceptIds, []);
  assert.equal(deriveHomeRecommendation(resolved.progress).conceptId, "revenue");
});

test("the provider exposes one readiness contract shared by Home and Learn", async () => {
  const [provider, home, learn, summary, sequence] = await Promise.all([
    readSource("components/learning-progress-provider.tsx"),
    readSource("components/learning-home.tsx"),
    readSource("components/learning-path-view.tsx"),
    readSource("components/lesson-progress-summary.tsx"),
    readSource("components/lesson-sequence-navigation.tsx"),
  ]);

  assert.match(provider, /createPendingLearningProgressState/);
  assert.match(provider, /resolveLearningProgressState/);
  assert.match(provider, /isHydrated/);

  for (const consumer of [home, learn, summary, sequence]) {
    assert.match(consumer, /useLearningProgress/);
    assert.match(consumer, /isHydrated/);
  }
});

test("progress-sensitive surfaces render neutral pending copy before deriving claims", async () => {
  const [home, learn, summary, sequence] = await Promise.all([
    readSource("components/learning-home.tsx"),
    readSource("components/learning-path-view.tsx"),
    readSource("components/lesson-progress-summary.tsx"),
    readSource("components/lesson-sequence-navigation.tsx"),
  ]);

  assert.match(home, /Loading saved progress/);
  assert.match(home, /isHydrated[^]*deriveHomeRecommendation/);
  assert.match(learn, /Loading saved progress/);
  assert.match(learn, /isHydrated[^]*deriveHomeRecommendation/);
  assert.match(learn, /isHydrated[^]*chapterCompleted/);
  assert.match(summary, /Loading saved progress/);
  assert.match(sequence, /isHydrated[^]*Loading saved progress/);

  for (const consumer of [home, learn, summary]) {
    assert.doesNotMatch(consumer, /shimmer|animate-pulse/i);
  }
});
