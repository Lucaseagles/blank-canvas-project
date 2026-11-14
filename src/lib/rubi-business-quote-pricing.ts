export type BusinessPriceTier = { min_quantity: number; unit_price: number };
export type BusinessPriceInput = {
  title: string;
  quantity: number;
  minQuantity: number;
  basePrice: number;
  tiers: BusinessPriceTier[];
};

/** Pure pricing kernel. No trust in browser price/total, no floating cents rounding drift. */
export function calculateRubiBusinessLine(input: BusinessPriceInput): { unitCents: number; totalCents: number } {
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 100000)
    throw new Error("Quantidade inválida.");
  if (!Number.isSafeInteger(input.minQuantity) || input.minQuantity < 1 || input.quantity < input.minQuantity)
    throw new Error(`Quantidade inferior ao mínimo do produto: ${input.title}.`);
  const toCents = (value: number) => {
    if (!Number.isFinite(value) || value <= 0 || value > 100000) throw new Error("Preço de atacado inválido.");
    const cents = Math.round(value * 100);
    if (Math.abs(value * 100 - cents) > 0.001) throw new Error("Precisão inválida para preço do atacado.");
    return cents;
  };
  let unitCents = toCents(input.basePrice);
  let threshold = input.minQuantity - 1;
  // Database relation order is unspecified. Highest eligible minimum wins.
  const ordered = [...input.tiers].sort((a,b) => a.min_quantity - b.min_quantity);
  for (const tier of ordered) {
    if (!Number.isSafeInteger(tier.min_quantity) || tier.min_quantity < input.minQuantity
      || tier.min_quantity > input.quantity || tier.min_quantity <= threshold) continue;
    threshold = tier.min_quantity;
    unitCents = toCents(tier.unit_price);
  }
  const totalCents = unitCents * input.quantity;
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw new Error("Total inválido.");
  return { unitCents, totalCents };
}
