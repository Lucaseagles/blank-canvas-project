import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("global premium layer provides reusable low-cost surfaces and accessible focus", () => {
  const css = read("../styles.css");
  assert.match(css, /\\.hub-premium-surface/);
  assert.match(css, /\\.hub-interactive/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /backdrop-filter: none !important/);
});

test("product cards avoid continuous scan and pulse effects and use restrained transitions", () => {
  const card = read("../components/product/ProductCard.tsx");
  assert.doesNotMatch(card, /animate-scan/);
  assert.doesNotMatch(card, /animate-pulse/);
  assert.match(card, /duration-200 ease-out/);
  assert.match(card, /group-hover:scale-\\[1\\.04\\]/);
});
