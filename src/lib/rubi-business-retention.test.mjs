import test from "node:test";
import assert from "node:assert/strict";
import { hasRubiReplenishmentOverlap } from "./rubi-business-retention.ts";

test("replenishment must include at least one previously quoted product", () => {
  const previous = [{ productId: "sku-a" }, { productId: "sku-b" }];
  assert.equal(hasRubiReplenishmentOverlap(previous, ["sku-b", "sku-new"]), true);
  assert.equal(hasRubiReplenishmentOverlap(previous, ["sku-new"]), false);
  assert.equal(hasRubiReplenishmentOverlap(previous, []), false);
  assert.equal(hasRubiReplenishmentOverlap([], ["sku-a"]), false);
});
test("invalid historic products never qualify", () => {
  assert.equal(hasRubiReplenishmentOverlap([{}, { productId: "" }], ["sku-a"]), false);
  assert.equal(hasRubiReplenishmentOverlap([{ productId: "sku-a" }], ["sku-a-extra"]), false);
});
