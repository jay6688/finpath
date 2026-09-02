import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");

test("Home presents the approved hybrid path without fake destinations", async () => {
  const home = await readSource("components/learning-home.tsx");
  const navigation = await readSource("components/app-navigation.tsx");

  assert.match(home, /Understand one financial idea at a time/);
  assert.match(home, /Your next step/);
  assert.match(home, /View full learning path/);
  assert.match(home, /More concepts coming/);
  assert.doesNotMatch(home, /APPLE FIRST|About 7 minutes|about 5 min/i);
  assert.doesNotMatch(navigation, /News|Tutor|Practice|Progress/);
  assert.match(navigation, /label: "Home"/);
  assert.match(navigation, /label: "Learn"/);
  assert.match(navigation, /label: "Explore"/);
});

test("Company research keeps provenance and mobile-native exact records", async () => {
  const company = await readSource("app/company/aapl/page.tsx");
  const history = await readSource("components/revenue-history.tsx");

  assert.match(company, /Learning margin/);
  assert.match(company, /SEC \{latest\.form\}/);
  assert.match(history, /className="mobile-records"/);
  assert.match(history, /Open SEC filing/);
  assert.match(history, /fact\.accession/);
});

test("Production data requests require an explicit HTTPS API origin", async () => {
  const apiClient = await readSource("lib/api.ts");

  assert.match(apiClient, /FINPATH_API_BASE_URL is required for a production deployment/);
  assert.match(apiClient, /parsedUrl\.protocol !== "https:"/);
  assert.match(apiClient, /return "http:\/\/127\.0\.0\.1:8000"/);
});
