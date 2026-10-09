import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("Explore landing uses the runtime registry as an integrated research directory", async () => {
  const [page, directory, styles] = await Promise.all([
    readSource("app/explore/page.tsx"),
    readSource("components/explore-directory.tsx"),
    readSource("components/explore-composition.module.css"),
  ]);

  assert.match(page, /getSupportedCompanies\(\)/);
  assert.match(page, /<ExploreDirectory companies=\{companies\}/);
  assert.doesNotMatch(page, /\[(?:[^\]]*?["'](?:AAPL|MSFT|WMT)["'])/);
  assert.match(directory, /companies\.map/);
  assert.match(directory, /Pick a real company and inspect how its financial records connect/);
  assert.match(directory, /company\.capabilities/);
  assert.match(directory, /Reviewed coverage/);
  assert.doesNotMatch(directory, /Research available/);
  assert.match(styles, /@media \(min-width: 48rem\)/);
  assert.match(styles, /@media \(min-width: 75rem\)/);
});

test("Explore remains outside progress and market-data concerns", async () => {
  const sources = await Promise.all([
    readSource("app/explore/page.tsx"),
    readSource("components/explore-directory.tsx"),
  ]);
  const combined = sources.join("\n");

  assert.doesNotMatch(combined, /useLearningProgress|LearningProgressProvider|isHydrated/);
  assert.doesNotMatch(combined, /share price|price chart|daily movement|analyst target|BUY|SELL/i);
  assert.doesNotMatch(combined, /416161000000|331839000000|713163000000/);
});
