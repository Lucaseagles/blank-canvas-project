import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { fetchAllFinancialRows, fetchFinancialRowsByIds } from "./financial-pagination.server";

export const getPartnerFinanceSummaryAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({ commercial_profile_id: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const profiles = await fetchAllFinancialRows(() => (supabaseAdmin as any)
      .from("commercial_profiles").select("id,display_name")
      .eq("audience", "partner").order("id", { ascending: true }));
    const links = await fetchAllFinancialRows(() => {
      let query = (supabaseAdmin as any)
        .from("hub_partner_referral_links").select("id,commercial_profile_id");
      if (data.commercial_profile_id) query = query.eq("commercial_profile_id", data.commercial_profile_id);
      return query.order("id", { ascending: true });
    });
    const ids = links.map((link: { id: string }) => link.id);
    if (!ids.length) return { profiles, sales: 0, grossAmount: 0, accruedCommission: 0, paidCommission: 0, pendingCommission: 0 };
    const sales = await fetchFinancialRowsByIds(ids, (batchIds) => (supabaseAdmin as any)
      .from("hub_partner_confirmed_sales").select("id,gross_amount,commission_amount")
      .in("referral_link_id", batchIds).order("id", { ascending: true }));
    const saleIds = sales.map((sale: { id: string }) => sale.id);
    const paid = saleIds.length ? await fetchFinancialRowsByIds(saleIds, (batchIds) => (supabaseAdmin as any)
      .from("hub_partner_commission_payout_items").select("id,sale_id,commission_amount")
      .in("sale_id", batchIds).order("id", { ascending: true })) : [];
    const paidCommission = paid.reduce((sum: number, item: { commission_amount: number }) => sum + Number(item.commission_amount), 0);
    const grossAmount = sales.reduce((sum: number, sale: { gross_amount: number }) => sum + Number(sale.gross_amount), 0);
    const accruedCommission = (sales ?? []).reduce((sum: number, sale: { commission_amount: number }) => sum + Number(sale.commission_amount), 0);
    return {
      profiles,
      sales: sales.length,
      grossAmount,
      accruedCommission,
      paidCommission,
      pendingCommission: Math.max(0, accruedCommission - paidCommission),
    };
  });
