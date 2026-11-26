import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("global premium layer provides reusable low-cost surfaces and accessible focus", () => {
  const css = read("../styles.css");
  assert.ok(css.includes(".hub-premium-surface"));
  assert.ok(css.includes(".hub-interactive"));
  assert.ok(css.includes(":focus-visible"));
  assert.ok(css.includes("prefers-reduced-motion: reduce"));
  assert.ok(css.includes("backdrop-filter: none !important"));
});

test("product cards avoid continuous scan and pulse effects and use restrained transitions", () => {
  const card = read("../components/product/ProductCard.tsx");
  assert.ok(!card.includes("animate-scan"));
  assert.ok(!card.includes("animate-pulse"));
  assert.ok(card.includes("duration-200 ease-out"));
  assert.ok(card.includes("group-hover:scale-[1.04]"));
});
