import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getPartnerFinanceSummaryAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({ commercial_profile_id: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles, error: profilesError } = await (supabaseAdmin as any)
      .from("commercial_profiles").select("id,display_name").eq("audience", "partner").limit(1000);
    if (profilesError) throw profilesError;
    const { data: links, error: linksError } = await (supabaseAdmin as any)
      .from("hub_partner_referral_links").select("id,commercial_profile_id").limit(5000);
    if (linksError) throw linksError;
    const eligibleLinks = (links ?? []).filter((link: { commercial_profile_id: string }) =>
      !data.commercial_profile_id || link.commercial_profile_id === data.commercial_profile_id);
    const ids = eligibleLinks.map((link: { id: string }) => link.id);
    if (!ids.length) return { profiles: profiles ?? [], sales: 0, grossAmount: 0, accruedCommission: 0, paidCommission: 0, pendingCommission: 0 };
    const { data: sales, error: salesError } = await (supabaseAdmin as any)
      .from("hub_partner_confirmed_sales").select("id,gross_amount,commission_amount")
      .in("referral_link_id", ids).limit(10000);
    if (salesError) throw salesError;
    const saleIds = (sales ?? []).map((sale: { id: string }) => sale.id);
    let paidCommission = 0;
    if (saleIds.length) {
      const { data: paid, error: paidError } = await (supabaseAdmin as any)
        .from("hub_partner_commission_payout_items").select("sale_id,commission_amount")
        .in("sale_id", saleIds).limit(10000);
      if (paidError) throw paidError;
      paidCommission = (paid ?? []).reduce((sum: number, item: { commission_amount: number }) => sum + Number(item.commission_amount), 0);
    }
    const grossAmount = (sales ?? []).reduce((sum: number, sale: { gross_amount: number }) => sum + Number(sale.gross_amount), 0);
    const accruedCommission = (sales ?? []).reduce((sum: number, sale: { commission_amount: number }) => sum + Number(sale.commission_amount), 0);
    return {
      profiles: profiles ?? [],
      sales: sales?.length ?? 0,
      grossAmount,
      accruedCommission,
      paidCommission,
      pendingCommission: Math.max(0, accruedCommission - paidCommission),
    };
  });
