import test from "node:test";
import assert from "node:assert/strict";
import { calculateRubiBusinessLine } from "./rubi-business-quote-pricing.ts";

test("base wholesale price and minimum quantity are enforced", () => {
  assert.deepEqual(calculateRubiBusinessLine({
    title: "Produto teste", quantity: 10, minQuantity: 10, basePrice: 58, tiers: [],
  }), { unitCents: 5800, totalCents: 58000 });
  assert.throws(() => calculateRubiBusinessLine({
    title: "Produto teste", quantity: 9, minQuantity: 10, basePrice: 58, tiers: [],
  }), /mínimo/);
});

test("largest eligible tier wins even when tiers are not sorted", () => {
  const tiered = { title: "Lote", minQuantity: 10, basePrice: 58, tiers: [
    { min_quantity: 50, unit_price: 50.15 },
    { min_quantity: 10, unit_price: 57.90 },
    { min_quantity: 100, unit_price: 48.40 },
  ] };
  assert.deepEqual(calculateRubiBusinessLine({ ...tiered, quantity: 60 }),
    { unitCents: 5015, totalCents: 300900 });
  assert.deepEqual(calculateRubiBusinessLine({ ...tiered, quantity: 100 }),
    { unitCents: 4840, totalCents: 484000 });
});

test("reject invalid prices, fractional units and extreme quantities", () => {
  const valid = { title: "Lote", minQuantity: 10, quantity: 10, basePrice: 58, tiers: [] };
  for (const quantity of [0, -1, 2.5, 100001, NaN]) {
    assert.throws(() => calculateRubiBusinessLine({ ...valid, quantity }));
  }
  for (const basePrice of [-10, 0, NaN, 58.999]) {
    assert.throws(() => calculateRubiBusinessLine({ ...valid, basePrice }));
  }
});
