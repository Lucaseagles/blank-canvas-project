import test from "node:test";
import assert from "node:assert/strict";
import { estimateRubiABSampleSize } from "./rubi-ab-sample-size.ts";

test("estimates equal-sized arms and exposes the statistical assumptions", () => {
  const result = estimateRubiABSampleSize({
    baselineRatePercent: 5,
    minimumDetectableEffectPoints: 2,
  });
  assert.ok(result);
  assert.ok(result.perArm > 100);
  assert.equal(result.total, result.perArm * 2);
  assert.equal(result.challengerRatePercent, 7);
  assert.equal(result.alpha, 0.05);
  assert.equal(result.power, 0.8);
});

test("smaller effects require more observations than larger effects", () => {
  const small = estimateRubiABSampleSize({ baselineRatePercent: 5, minimumDetectableEffectPoints: 1 });
  const large = estimateRubiABSampleSize({ baselineRatePercent: 5, minimumDetectableEffectPoints: 3 });
  assert.ok(small && large);
  assert.ok(small.perArm > large.perArm);
});

test("higher baseline rates at the same absolute effect are supported", () => {
  const low = estimateRubiABSampleSize({ baselineRatePercent: 2, minimumDetectableEffectPoints: 1 });
  const high = estimateRubiABSampleSize({ baselineRatePercent: 20, minimumDetectableEffectPoints: 1 });
  assert.ok(low && high);
  assert.ok(high.perArm > low.perArm);
});

test("rejects impossible, zero, negative and non-finite inputs", () => {
  for (const input of [
    { baselineRatePercent: 0, minimumDetectableEffectPoints: 1 },
    { baselineRatePercent: 100, minimumDetectableEffectPoints: 1 },
    { baselineRatePercent: 5, minimumDetectableEffectPoints: 0 },
    { baselineRatePercent: 99, minimumDetectableEffectPoints: 2 },
    { baselineRatePercent: Number.NaN, minimumDetectableEffectPoints: 1 },
    { baselineRatePercent: 5, minimumDetectableEffectPoints: Number.POSITIVE_INFINITY },
  ]) assert.equal(estimateRubiABSampleSize(input), null);
});
