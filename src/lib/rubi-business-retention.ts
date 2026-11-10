/** Replenishment is interest in a new quote, not proof of a paid reorder. */
export function hasRubiReplenishmentOverlap(
  priorLines: ReadonlyArray<{ productId?: string }>,
  currentProductIds: ReadonlyArray<string>,
): boolean {
  const previousIds = new Set(
    priorLines.map(line => line.productId).filter((id): id is string => typeof id === "string"),
  );
  return currentProductIds.some(id => previousIds.has(id));
}
