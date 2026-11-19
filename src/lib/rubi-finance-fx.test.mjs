import test from "node:test";
import assert from "node:assert/strict";
import {
  convertMinorUnits,
  formatMinorUnits,
  parseAmountToMinorUnits,
} from "./rubi-finance-fx.ts";

const currencies = [
  { code: "BRL", minorUnit: 2 },
  { code: "USD", minorUnit: 2 },
  { code: "JPY", minorUnit: 0 },
  { code: "KWD", minorUnit: 3 },
];

test("parses and formats currency amounts using explicit minor-unit scales", () => {
  assert.equal(parseAmountToMinorUnits("12.34", "BRL", currencies), "1234");
  assert.equal(parseAmountToMinorUnits("1200", "JPY", currencies), "1200");
  assert.equal(parseAmountToMinorUnits("1.234", "KWD", currencies), "1234");
  assert.equal(formatMinorUnits("1234", "KWD", currencies), "1.234");
  assert.equal(formatMinorUnits("1200", "JPY", currencies), "1200");
});

test("rejects unsupported currencies and excess fractional precision", () => {
  assert.throws(() => parseAmountToMinorUnits("1.00", "ABC", currencies), /unsupported/);
  assert.throws(() => parseAmountToMinorUnits("1.001", "BRL", currencies), /precision/);
  assert.throws(() => parseAmountToMinorUnits("1.0", "JPY", currencies), /precision/);
  assert.throws(() => parseAmountToMinorUnits("-1.00", "BRL", currencies), /plain non-negative/);
});

test("converts currencies with exact decimal arithmetic and explicit rate direction", () => {
  const result = convertMinorUnits({
    amountMinor: "10000",
    sourceCurrency: "USD",
    targetCurrency: "BRL",
    rate: "5.25",
    definitions: currencies,
  });
  assert.deepEqual(result, {
    sourceAmountMinor: "10000",
    sourceCurrency: "USD",
    targetAmountMinor: "52500",
    targetCurrency: "BRL",
    rate: "5.25",
    rateDirection: "target_major_per_source_major",
    roundingMode: "half_up",
  });
});

test("rounds only once at target minor-unit boundary using half-up", () => {
  const result = convertMinorUnits({
    amountMinor: "1",
    sourceCurrency: "JPY",
    targetCurrency: "BRL",
    rate: "0.005",
    definitions: currencies,
  });
  assert.equal(result.targetAmountMinor, "1");
});

test("supports zero-decimal and three-decimal targets without truncation", () => {
  const jpy = convertMinorUnits({
    amountMinor: "100",
    sourceCurrency: "USD",
    targetCurrency: "JPY",
    rate: "150",
    definitions: currencies,
  });
  const kwd = convertMinorUnits({
    amountMinor: "100",
    sourceCurrency: "USD",
    targetCurrency: "KWD",
    rate: "0.3075",
    definitions: currencies,
  });
  // 100 USD minor units = 1.00 USD. At 150 JPY/USD this is 150 JPY;
  // at 0.3075 KWD/USD this is 0.3075 KWD, rounded half-up to 308 fils.
  assert.equal(jpy.targetAmountMinor, "150");
  assert.equal(kwd.targetAmountMinor, "308");
});

test("rejects zero, malformed, over-precision and same-currency rates", () => {
  const base = {
    amountMinor: "100",
    sourceCurrency: "USD",
    targetCurrency: "BRL",
    definitions: currencies,
  };
  assert.throws(() => convertMinorUnits({ ...base, rate: "0" }), /greater than zero/);
  assert.throws(() => convertMinorUnits({ ...base, rate: "1e2" }), /plain non-negative/);
  assert.throws(() => convertMinorUnits({ ...base, rate: "1.1234567890123456789" }), /precision/);
  assert.throws(() => convertMinorUnits({ ...base, targetCurrency: "USD", rate: "1" }), /must differ/);
});

test("does not use JavaScript floating point for monetary calculations", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(new URL("./rubi-finance-fx.ts", import.meta.url), "utf8");
  assert.match(source, /BigInt/);
  assert.doesNotMatch(source, /parseFloat|toFixed\s*\(/);
});
