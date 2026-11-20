export type LegacyFinanceSale = {
  id: string;
  commission_amount: number | string | null;
  currency?: string | null;
};

export type LegacyFinancePayoutItem = {
  id: string;
  payout_id: string | null;
  sale_id: string | null;
  commission_amount: number | string | null;
  currency?: string | null;
};

export type LegacyFinancePayout = { id: string; payment_reference?: string | null };

const hasCurrency = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Z]{3}$/.test(value);

const positiveAmount = (value: unknown): boolean => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
};

/**
 * Read-only migration readiness projection for the legacy partner subledger.
 * It never creates canonical finance records and never treats a payout reference
 * as external bank evidence. Missing legacy currency is a hard migration blocker.
 */
export function summarizeLegacyFinanceReadiness(input: {
  sales: LegacyFinanceSale[];
  payoutItems: LegacyFinancePayoutItem[];
  payouts: LegacyFinancePayout[];
}) {
  const payoutIds = new Set(input.payouts.map((payout) => payout.id));
  const saleIds = new Set(input.sales.map((sale) => sale.id));
  const commissionSales = input.sales.filter((sale) => positiveAmount(sale.commission_amount));
  const payoutItems = input.payoutItems.filter((item) => positiveAmount(item.commission_amount));
  const salesMissingCurrency = commissionSales.filter((sale) => !hasCurrency(sale.currency)).length;
  const payoutItemsMissingCurrency = payoutItems.filter((item) => !hasCurrency(item.currency)).length;
  const orphanPayoutItems = payoutItems.filter((item) =>
    !item.payout_id || !payoutIds.has(item.payout_id) || !item.sale_id || !saleIds.has(item.sale_id),
  ).length;
  const totalBlocked = salesMissingCurrency + payoutItemsMissingCurrency + orphanPayoutItems;

  return {
    status: commissionSales.length + payoutItems.length === 0
      ? "empty" as const
      : totalBlocked > 0
        ? "blocked" as const
        : "review_required" as const,
    commissionSales: commissionSales.length,
    payoutItems: payoutItems.length,
    salesMissingCurrency,
    payoutItemsMissingCurrency,
    orphanPayoutItems,
    bankVerifiedPayoutItems: 0,
    migrationReady: commissionSales.length + payoutItems.length > 0 && totalBlocked === 0,
  };
}
