/**
 * Approximate equal-allocation sample size for a two-arm proportion experiment.
 * Inputs and outputs use percentage points; the result is a planning estimate,
 * not a sequential stopping rule or a guarantee of statistical significance.
 */
export type RubiABSampleSizeInput = {
  baselineRatePercent: number;
  minimumDetectableEffectPoints: number;
};
export type RubiABSampleSizeEstimate = {
  perArm: number;
  total: number;
  baselineRatePercent: number;
  challengerRatePercent: number;
  alpha: 0.05;
  power: 0.8;
};
export function estimateRubiABSampleSize(
  input: RubiABSampleSizeInput,
): RubiABSampleSizeEstimate | null {
  const { baselineRatePercent, minimumDetectableEffectPoints } = input;
  if (
    !Number.isFinite(baselineRatePercent) ||
    !Number.isFinite(minimumDetectableEffectPoints) ||
    baselineRatePercent <= 0 ||
    baselineRatePercent >= 100 ||
    minimumDetectableEffectPoints <= 0 ||
    minimumDetectableEffectPoints >= 100 - baselineRatePercent
  ) return null;

  const p1 = baselineRatePercent / 100;
  const p2 = (baselineRatePercent + minimumDetectableEffectPoints) / 100;
  const pooled = (p1 + p2) / 2;
  // Two-sided alpha=5% (z=1.96), 80% power (z=0.84), equal-sized arms.
  const numerator =
    1.96 * Math.sqrt(2 * pooled * (1 - pooled)) +
    0.84 * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  const perArm = Math.ceil((numerator * numerator) / ((p2 - p1) ** 2));
  if (!Number.isSafeInteger(perArm) || perArm < 1) return null;
  return {
    perArm,
    total: perArm * 2,
    baselineRatePercent,
    challengerRatePercent: baselineRatePercent + minimumDetectableEffectPoints,
    alpha: 0.05,
    power: 0.8,
  };
}
