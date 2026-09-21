import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createDefaultLearningProgress,
  deriveConceptState,
  deriveCurrentConcept,
  deriveHomeRecommendation,
  LEARNING_PROGRESS_STORAGE_KEY,
  markConceptsExplored,
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

test("a fresh browser starts at Revenue with Revenue Growth available separately", () => {
  const progress = readLearningProgress(memoryStorage());

  assert.deepEqual(progress, createDefaultLearningProgress());
  assert.equal(deriveCurrentConcept(progress), "revenue");
  assert.equal(deriveConceptState("revenue", progress), "current");
  assert.equal(deriveConceptState("revenue-growth", progress), "available");
  assert.equal(deriveConceptState("profit", progress), "available");
  assert.equal(deriveHomeRecommendation(progress).action, "Start");
  assert.equal(
    deriveHomeRecommendation(progress).href,
    "/learn/company-analysis/revenue",
  );
});

test("device-local progress writes and reads only versioned concept IDs", () => {
  const storage = memoryStorage();
  const progress = markConceptsExplored(createDefaultLearningProgress(), ["revenue"]);

  assert.equal(writeLearningProgress(storage, progress), true);
  assert.deepEqual(readLearningProgress(storage), {
    version: 1,
    exploredConceptIds: ["revenue"],
  });

  const serialized = storage.getItem(LEARNING_PROGRESS_STORAGE_KEY);
  assert.doesNotMatch(serialized, /416|Revenue value|SEC/i);
});

test("existing version-1 progress is preserved when Operating Cash Flow is added", () => {
  const storage = memoryStorage({
    [LEARNING_PROGRESS_STORAGE_KEY]: JSON.stringify({
      version: 1,
      exploredConceptIds: [
        "revenue",
        "revenue-growth",
        "profit",
        "net-profit-margin",
      ],
    }),
  });

  const progress = readLearningProgress(storage);
  assert.deepEqual(progress.exploredConceptIds, [
    "revenue",
    "revenue-growth",
    "profit",
    "net-profit-margin",
  ]);
  assert.equal(deriveCurrentConcept(progress), "operating-cash-flow");
  assert.equal(
    deriveHomeRecommendation(progress).href,
    "/learn/company-analysis/operating-cash-flow",
  );
});

test("existing version-1 progress remains valid when two more cash-flow concepts are added", () => {
  const storage = memoryStorage({
    [LEARNING_PROGRESS_STORAGE_KEY]: JSON.stringify({
      version: 1,
      exploredConceptIds: [
        "revenue",
        "revenue-growth",
        "profit",
        "net-profit-margin",
        "operating-cash-flow",
      ],
    }),
  });

  const progress = readLearningProgress(storage);
  assert.equal(deriveCurrentConcept(progress), "investing-financing-cash-flow");
  assert.equal(
    deriveHomeRecommendation(progress).href,
    "/learn/company-analysis/investing-financing-cash-flow",
  );
});

test("existing version-1 progress advances to Balance Sheet without a storage migration", () => {
  const storage = memoryStorage({
    [LEARNING_PROGRESS_STORAGE_KEY]: JSON.stringify({
      version: 1,
      exploredConceptIds: [
        "revenue",
        "revenue-growth",
        "profit",
        "net-profit-margin",
        "operating-cash-flow",
        "investing-financing-cash-flow",
        "free-cash-flow",
      ],
    }),
  });

  const progress = readLearningProgress(storage);
  assert.equal(deriveCurrentConcept(progress), "balance-sheet");
  assert.equal(
    deriveHomeRecommendation(progress).href,
    "/learn/company-analysis/balance-sheet",
  );
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
  assert.deepEqual(readLearningProgress(incompleteRevenue), {
    version: 1,
    exploredConceptIds: ["revenue"],
  });
});

test("current is always the first recommended milestone not yet explored", () => {
  const revenue = markConceptsExplored(createDefaultLearningProgress(), ["revenue"]);
  const growth = markConceptsExplored(revenue, ["revenue-growth"]);
  const profit = markConceptsExplored(growth, ["profit"]);
  const margin = markConceptsExplored(profit, ["net-profit-margin"]);
  const operating = markConceptsExplored(margin, ["operating-cash-flow"]);
  const investingFinancing = markConceptsExplored(operating, [
    "investing-financing-cash-flow",
  ]);
  const freeCashFlow = markConceptsExplored(investingFinancing, ["free-cash-flow"]);
  const balanceSheet = markConceptsExplored(freeCashFlow, ["balance-sheet"]);
  const cashDebt = markConceptsExplored(balanceSheet, ["cash-and-debt"]);
  const all = markConceptsExplored(cashDebt, ["three-statements-connect"]);

  assert.equal(deriveCurrentConcept(revenue), "revenue-growth");
  assert.equal(deriveCurrentConcept(growth), "profit");
  assert.equal(deriveCurrentConcept(profit), "net-profit-margin");
  assert.equal(deriveCurrentConcept(margin), "operating-cash-flow");
  assert.equal(deriveCurrentConcept(operating), "investing-financing-cash-flow");
  assert.equal(deriveCurrentConcept(investingFinancing), "free-cash-flow");
  assert.equal(deriveCurrentConcept(freeCashFlow), "balance-sheet");
  assert.equal(deriveCurrentConcept(balanceSheet), "cash-and-debt");
  assert.equal(deriveCurrentConcept(cashDebt), "three-statements-connect");
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

test("Revenue and Revenue Growth keep independent meaningful completion triggers", async () => {
  const [explorer, context, sequence] = await Promise.all([
    readSource("components/revenue-growth-explorer.tsx"),
    readSource("components/revenue-history-context.tsx"),
    readSource("components/lesson-sequence-navigation.tsx"),
  ]);
  const progress = markConceptsExplored(createDefaultLearningProgress(), ["revenue"]);

  assert.deepEqual(progress.exploredConceptIds, ["revenue"]);
  assert.match(explorer, /id="revenue-growth"/);
  assert.match(explorer, /markExplored\(\["revenue-growth"\]\)/);
  assert.match(sequence, /completeCurrentOnNext[^]*markExplored\(\[currentConceptId\]\)/);
  assert.doesNotMatch(context, /markExplored|useLearningProgress/);
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

test("Home and Learn expose derived states, real routes, and no fabricated duration", async () => {
  const [home, path, navigation, catalog] = await Promise.all([
    readSource("components/learning-home.tsx"),
    readSource("components/learning-path-view.tsx"),
    readSource("components/app-navigation.tsx"),
    readSource("lib/lesson-catalog.ts"),
  ]);

  assert.match(home, /deriveHomeRecommendation\(progress\)/);
  assert.match(home, /concepts explored/);
  assert.doesNotMatch(home, /home-path-preview/);
  assert.match(path, /aria-current=\{state === "current" \? "step"/);
  assert.match(path, /lessonCatalog\.map/);
  assert.match(path, /actionLabel\(state, lesson\.id === "revenue"\)/);
  assert.match(path, /More concepts coming/);
  assert.match(catalog, /href: "\/learn\/company-analysis\/operating-cash-flow"/);
  assert.doesNotMatch(path, /href=.*More concepts coming/);
  assert.match(navigation, /href: "\/learn"/);
  assert.doesNotMatch(`${home}${path}`, /\b(?:minute|minutes|min)\b/i);
});

test("every progress state recommends its canonical Learn route", () => {
  let progress = createDefaultLearningProgress();
  const expected = [
    ["revenue", "/learn/company-analysis/revenue"],
    ["revenue-growth", "/learn/company-analysis/revenue-growth"],
    ["profit", "/learn/company-analysis/profit"],
    ["net-profit-margin", "/learn/company-analysis/net-profit-margin"],
    ["operating-cash-flow", "/learn/company-analysis/operating-cash-flow"],
    ["investing-financing-cash-flow", "/learn/company-analysis/investing-financing-cash-flow"],
    ["free-cash-flow", "/learn/company-analysis/free-cash-flow"],
    ["balance-sheet", "/learn/company-analysis/balance-sheet"],
    ["cash-and-debt", "/learn/company-analysis/cash-and-debt"],
    ["three-statements-connect", "/learn/company-analysis/three-statements-connect"],
  ];

  for (const [conceptId, href] of expected) {
    const recommendation = deriveHomeRecommendation(progress);
    assert.equal(recommendation.conceptId, conceptId);
    assert.equal(recommendation.href, href);
    progress = markConceptsExplored(progress, [conceptId]);
  }
});
