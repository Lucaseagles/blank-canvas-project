import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { fetchAllFinancialRows, fetchFinancialRowsByIds } from "./financial-pagination.server";

export const getPartnerFinanceHistoryAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    commercial_profile_id: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).max(100000).default(0),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const profiles = await fetchAllFinancialRows(() => (supabaseAdmin as any)
      .from("commercial_profiles").select("id,display_name")
      .eq("audience", "partner").order("id", { ascending: true }));
    const eligibleLinks = await fetchAllFinancialRows(() => {
      let query = (supabaseAdmin as any).from("hub_partner_referral_links")
        .select("id,commercial_profile_id,product_id");
      if (data.commercial_profile_id) query = query.eq("commercial_profile_id", data.commercial_profile_id);
      return query.order("id", { ascending: true });
    });
    if (!eligibleLinks.length) return { total: 0, sales: [], profiles };
    const allSales = await fetchFinancialRowsByIds(
      eligibleLinks.map((link: { id: string }) => link.id),
      (batchIds) => (supabaseAdmin as any).from("hub_partner_confirmed_sales")
        .select("id,referral_link_id,external_order_id,source,gross_amount,commission_percent,commission_amount,confirmed_at")
        .in("referral_link_id", batchIds).order("id", { ascending: true }),
    );
    allSales.sort((a: { id: string; confirmed_at: string }, b: { id: string; confirmed_at: string }) =>
      b.confirmed_at.localeCompare(a.confirmed_at) || b.id.localeCompare(a.id));
    const sales = allSales.slice(data.offset, data.offset + data.limit) as Array<{ id: string; referral_link_id: string; external_order_id: string; source: string; gross_amount: number; commission_percent: number; commission_amount: number; confirmed_at: string }>;
    const linkById = new Map<string, { commercial_profile_id: string; product_id: string }>(
      eligibleLinks.map((link: { id: string; commercial_profile_id: string; product_id: string }) => [link.id, link]));
    const nameById = new Map<string, string>(profiles.map((p: { id: string; display_name: string }) => [p.id, p.display_name]));
    return {
      total: allSales.length,
      profiles,
      sales: sales.map((sale) => {
        const link = linkById.get(sale.referral_link_id);
        return { ...sale, partner_name: link ? nameById.get(link.commercial_profile_id) ?? "Parceiro" : "Parceiro", product_id: link?.product_id ?? null };
      }),
    };
  });
