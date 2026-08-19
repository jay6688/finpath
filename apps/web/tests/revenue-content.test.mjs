import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentUrl = new URL("../src/content/concepts/revenue.json", import.meta.url);
const content = JSON.parse(await readFile(contentUrl, "utf8"));

test("Revenue content supplies English and Chinese explanations", () => {
  assert.equal(content.conceptId, "revenue");
  assert.ok(content.locales.en.simpleDefinition.length > 40);
  assert.ok(content.locales["zh-CN"].simpleDefinition.length > 20);
});

test("Revenue teaching content carries reviewable provenance", () => {
  assert.ok(content.sources.length >= 2);

  for (const source of content.sources) {
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:");
    assert.ok(source.publisher);
    assert.ok(source.supports.length > 0);
    assert.match(source.accessedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
});

