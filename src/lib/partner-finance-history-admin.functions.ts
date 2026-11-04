import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getPartnerFinanceHistoryAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    commercial_profile_id: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).max(100000).default(0),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles, error: profilesError } = await (supabaseAdmin as any)
      .from("commercial_profiles").select("id,display_name").eq("audience", "partner").limit(1000);
    if (profilesError) throw profilesError;
    const { data: links, error: linksError } = await (supabaseAdmin as any)
      .from("hub_partner_referral_links").select("id,commercial_profile_id,product_id").limit(5000);
    if (linksError) throw linksError;
    const eligibleLinks = (links ?? []).filter((link: { commercial_profile_id: string }) =>
      !data.commercial_profile_id || link.commercial_profile_id === data.commercial_profile_id);
    if (!eligibleLinks.length) return { total: 0, sales: [], profiles: profiles ?? [] };
    const { data: sales, count, error: salesError } = await (supabaseAdmin as any)
      .from("hub_partner_confirmed_sales")
      .select("id,referral_link_id,external_order_id,source,gross_amount,commission_percent,commission_amount,confirmed_at", { count: "exact" })
      .in("referral_link_id", eligibleLinks.map((link: { id: string }) => link.id))
      .order("confirmed_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (salesError) throw salesError;
    const linkById = new Map<string, { commercial_profile_id: string; product_id: string }>(
      eligibleLinks.map((link: { id: string; commercial_profile_id: string; product_id: string }) => [link.id, link]));
    const nameById = new Map<string, string>((profiles ?? []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]));
    return {
      total: count ?? 0,
      profiles: profiles ?? [],
      sales: (sales ?? []).map((sale: { referral_link_id: string; [key: string]: unknown }) => {
        const link = linkById.get(sale.referral_link_id);
        return { ...sale, partner_name: link ? nameById.get(link.commercial_profile_id) ?? "Parceiro" : "Parceiro", product_id: link?.product_id ?? null };
      }),
    };
  });
