import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  conceptIds,
  createDefaultLearningProgress,
  deriveHomeRecommendation,
  markConceptsExplored,
} from "../src/lib/learning-progress.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("production Home uses a directed financial-system graph without sequence semantics", async () => {
  const [home, system, model] = await Promise.all([
    readSource("components/learning-home.tsx"),
    readSource("components/home-financial-system.tsx"),
    readSource("components/design-system-v2/relationship-model.ts"),
  ]);

  assert.match(home, /Explore how company numbers connect\./);
  assert.match(home, /REAL COMPANIES[^\n]*CONNECTED RECORDS/);
  assert.match(home, /HomeFinancialSystem/);
  assert.match(system, /Financial system/);
  assert.match(system, /Focus:/);
  assert.match(system, /from:\s*"business",\s*to:\s*"revenue"/);
  assert.match(system, /from:\s*"revenue",\s*to:\s*"profit"/);
  assert.match(system, /from:\s*"profit",\s*to:\s*"cash-flow"/);
  assert.match(model, /direction:\s*"incoming"\s*\|\s*"outgoing"/);

  for (const source of [home, system]) {
    assert.doesNotMatch(source, /\b(?:previous|next) concept\b|\b[1-7] of 7\b/i);
  }
});

test("graph focus remains independent from curriculum progress", async () => {
  const [home, system] = await Promise.all([
    readSource("components/learning-home.tsx"),
    readSource("components/home-financial-system.tsx"),
  ]);

  assert.match(system, /useState<FinancialObjectKind>\("revenue"\)/);
  assert.doesNotMatch(system, /useLearningProgress|deriveHomeRecommendation|exploredConceptIds/);
  assert.match(home, /useLearningProgress/);
  assert.match(home, /deriveHomeRecommendation/);
});

test("fresh, partial, and complete progress preserve the existing recommendations", () => {
  const fresh = createDefaultLearningProgress();
  const partial = markConceptsExplored(fresh, ["revenue", "revenue-growth"]);
  const complete = markConceptsExplored(fresh, conceptIds);

  assert.deepEqual(
    [deriveHomeRecommendation(fresh).title, deriveHomeRecommendation(fresh).action],
    ["Revenue", "Start"],
  );
  assert.deepEqual(
    [deriveHomeRecommendation(partial).title, deriveHomeRecommendation(partial).action],
    ["Profit / Net Income", "Continue"],
  );
  assert.deepEqual(
    [deriveHomeRecommendation(complete).title, deriveHomeRecommendation(complete).action],
    ["Company Analysis Capstone", "Review"],
  );
});

test("Home company entry is supplied only by the runtime registry", async () => {
  const [page, home] = await Promise.all([
    readSource("app/page.tsx"),
    readSource("components/learning-home.tsx"),
  ]);

  assert.match(page, /getSupportedCompanies\(\)/);
  assert.match(page, /ticker:\s*company\.ticker/);
  assert.match(page, /name:\s*company\.name/);
  assert.doesNotMatch(page, /\[(?:[^\]]*?["'](?:AAPL|MSFT|WMT)["'])/);
  assert.match(home, /companies\.map/);
});

test("Slice 1 ports only the approved V2 foundation and production shell/Home surface", async () => {
  const [layout, navigation, home, system] = await Promise.all([
    readSource("app/layout.tsx"),
    readSource("components/app-navigation.tsx"),
    readSource("components/learning-home.tsx"),
    readSource("components/home-financial-system.tsx"),
  ]);
  const combined = [layout, navigation, home, system].join("\n");

  assert.match(layout, /visual-system-v2\.css/);
  assert.match(layout, /Skip to content/);
  assert.match(layout, /main-content/);
  assert.match(layout, /LearningProgressProvider/);
  assert.match(navigation, /label: "Home"/);
  assert.match(navigation, /label: "Learn"/);
  assert.match(navigation, /label: "Explore"/);
  assert.doesNotMatch(combined, /design-lab|reconcept-stage-3|Current Product|Sandbox|fake search/i);
  assert.doesNotMatch(combined, /MetricDossier|NumberPassport|QuantitativeLedger/);
});
