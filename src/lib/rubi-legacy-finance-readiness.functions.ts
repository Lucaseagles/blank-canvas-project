import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "./auth-guards.server";
import { fetchAllFinancialRows } from "./financial-pagination.server";
import { summarizeLegacyFinanceReadiness } from "./rubi-legacy-finance-readiness";

export const getLegacyFinanceMigrationReadiness = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const [sales, payoutItems, payouts] = await Promise.all([
      fetchAllFinancialRows(() => db.from("hub_partner_confirmed_sales")
        .select("id,commission_amount").order("id", { ascending: true })),
      fetchAllFinancialRows(() => db.from("hub_partner_commission_payout_items")
        .select("id,payout_id,sale_id,commission_amount").order("id", { ascending: true })),
      fetchAllFinancialRows(() => db.from("hub_partner_commission_payouts")
        .select("id").order("id", { ascending: true })),
    ]);

    // Production schema inspection found no currency column on legacy sales or payout items.
    // Do not infer BRL from the UI locale or from a payment reference.
    const readiness = summarizeLegacyFinanceReadiness({
      sales: sales.map((sale: { id: string; commission_amount: number | string | null }) => ({
        id: sale.id, commission_amount: sale.commission_amount, currency: null,
      })),
      payoutItems: payoutItems.map((item: { id: string; payout_id: string; sale_id: string; commission_amount: number | string | null }) => ({
        id: item.id, payout_id: item.payout_id, sale_id: item.sale_id,
        commission_amount: item.commission_amount, currency: null,
      })),
      payouts,
    });

    return {
      ...readiness,
      source: "legacy_partner_subledger",
      readOnly: true,
      note: "Prévia somente leitura. Moeda ausente bloqueia a migração; referência de repasse não comprova liquidação bancária.",
    };
  });
