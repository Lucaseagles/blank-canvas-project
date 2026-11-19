export type CurrencyDefinition = {
  code: string;
  minorUnit: number;
};

export type FxRoundingMode = "half_up";

export type FxConversionResult = {
  sourceAmountMinor: string;
  sourceCurrency: string;
  targetAmountMinor: string;
  targetCurrency: string;
  rate: string;
  rateDirection: "target_major_per_source_major";
  roundingMode: FxRoundingMode;
};

const POW10_CACHE: bigint[] = [1n];

function pow10(scale: number): bigint {
  if (!Number.isInteger(scale) || scale < 0 || scale > 8) {
    throw new Error("Currency scale must be an integer between 0 and 8");
  }
  while (POW10_CACHE.length <= scale) {
    POW10_CACHE.push(POW10_CACHE[POW10_CACHE.length - 1] * 10n);
  }
  return POW10_CACHE[scale];
}

function getCurrency(code: string, definitions: readonly CurrencyDefinition[]): CurrencyDefinition {
  if (!/^[A-Z]{3}$/.test(code)) throw new Error("Currency must be an uppercase three-letter code");
  const matches = definitions.filter((item) => item.code === code);
  if (matches.length !== 1) throw new Error("Currency is unsupported or ambiguously configured");
  const definition = matches[0];
  if (!Number.isInteger(definition.minorUnit) || definition.minorUnit < 0 || definition.minorUnit > 8) {
    throw new Error("Currency minor unit is invalid");
  }
  return definition;
}

function parseUnsignedDecimal(value: string, maxScale: number): { coefficient: bigint; scale: number } {
  if (typeof value !== "string" || value.length > 80 || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    throw new Error("Amount/rate must be a plain non-negative decimal string");
  }
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > maxScale) throw new Error("Decimal precision exceeds the supported scale");
  const scale = fraction.length;
  return { coefficient: BigInt(whole + fraction), scale };
}

export function parseAmountToMinorUnits(
  amount: string,
  currencyCode: string,
  definitions: readonly CurrencyDefinition[],
): string {
  const currency = getCurrency(currencyCode, definitions);
  const parsed = parseUnsignedDecimal(amount, currency.minorUnit);
  return (parsed.coefficient * pow10(currency.minorUnit - parsed.scale)).toString();
}

export function formatMinorUnits(
  amountMinor: string,
  currencyCode: string,
  definitions: readonly CurrencyDefinition[],
): string {
  const currency = getCurrency(currencyCode, definitions);
  if (!/^(?:0|[1-9]\d*)$/.test(amountMinor)) throw new Error("Minor-unit amount must be a non-negative integer string");
  const value = BigInt(amountMinor);
  const scale = currency.minorUnit;
  if (scale === 0) return value.toString();
  const base = pow10(scale);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(scale, "0");
  return whole.toString() + "." + fraction;
}

function divideHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error("Rate denominator must be positive");
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * 2n >= denominator ? quotient + 1n : quotient;
}

/**
 * Converts integer minor units using an explicit rate:
 * 1 source major unit = rate target major units.
 * All arithmetic is exact BigInt rational arithmetic; only the final target
 * minor-unit boundary is rounded (half-up). The caller must supply a verified,
 * versioned currency registry and persist the returned snapshot with evidence.
 */
export function convertMinorUnits(input: {
  amountMinor: string;
  sourceCurrency: string;
  targetCurrency: string;
  rate: string;
  definitions: readonly CurrencyDefinition[];
  roundingMode?: FxRoundingMode;
}): FxConversionResult {
  const source = getCurrency(input.sourceCurrency, input.definitions);
  const target = getCurrency(input.targetCurrency, input.definitions);
  if (source.code === target.code) throw new Error("Source and target currencies must differ");
  if (!/^(?:0|[1-9]\d*)$/.test(input.amountMinor)) {
    throw new Error("Source amount must be a non-negative integer string");
  }
  if (input.roundingMode !== undefined && input.roundingMode !== "half_up") {
    throw new Error("Unsupported rounding mode");
  }

  const parsedRate = parseUnsignedDecimal(input.rate, 18);
  if (parsedRate.coefficient <= 0n) throw new Error("FX rate must be greater than zero");

  const numerator =
    BigInt(input.amountMinor) *
    parsedRate.coefficient *
    pow10(target.minorUnit);
  const denominator =
    pow10(source.minorUnit) *
    pow10(parsedRate.scale);
  const targetAmountMinor = divideHalfUp(numerator, denominator).toString();

  return {
    sourceAmountMinor: input.amountMinor,
    sourceCurrency: source.code,
    targetAmountMinor,
    targetCurrency: target.code,
    rate: input.rate,
    rateDirection: "target_major_per_source_major",
    roundingMode: "half_up",
  };
}
