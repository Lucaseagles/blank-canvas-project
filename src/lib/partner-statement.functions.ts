import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMyPartnerStatement = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({
    accessToken: z.string().min(1),
    offset: z.number().int().min(0).max(100000).default(0),
    limit: z.number().int().min(1).max(50).default(20),
  }).parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Autenticação indisponível.");
    const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: claims, error: authError } = await auth.auth.getClaims(data.accessToken);
    if (authError || !claims?.claims?.sub) throw new Error("Sessão inválida.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await (supabaseAdmin as any).from("commercial_profiles")
      .select("id").eq("user_id", claims.claims.sub).eq("audience", "partner").eq("status", "approved").maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return { total: 0, sales: [] };
    const { data: links, error: linksError } = await (supabaseAdmin as any).from("hub_partner_referral_links")
      .select("id,product_id").eq("commercial_profile_id", profile.id).limit(500);
    if (linksError) throw linksError;
    if (!links?.length) return { total: 0, sales: [] };
    const { data: sales, count, error: salesError } = await (supabaseAdmin as any)
      .from("hub_partner_confirmed_sales")
      .select("id,referral_link_id,external_order_id,gross_amount,commission_percent,commission_amount,confirmed_at", { count: "exact" })
      .in("referral_link_id", links.map((link: { id: string }) => link.id))
      .order("confirmed_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (salesError) throw salesError;
    if (!sales?.length) return { total: count ?? 0, sales: [] };
    const { data: items, error: itemsError } = await (supabaseAdmin as any)
      .from("hub_partner_commission_payout_items").select("sale_id,payout_id")
      .in("sale_id", sales.map((sale: { id: string }) => sale.id));
    if (itemsError) throw itemsError;
    const paidBySale = new Map<string, string>((items ?? []).map((item: { sale_id: string; payout_id: string }) => [item.sale_id, item.payout_id]));
    const payoutIds = [...new Set(paidBySale.values())];
    let paidDates = new Map<string, string>();
    if (payoutIds.length) {
      const { data: payouts, error: payoutError } = await (supabaseAdmin as any)
        .from("hub_partner_commission_payouts").select("id,paid_at").eq("commercial_profile_id", profile.id).in("id", payoutIds);
      if (payoutError) throw payoutError;
      paidDates = new Map<string, string>((payouts ?? []).map((payout: { id: string; paid_at: string }) => [payout.id, payout.paid_at]));
    }
    const productByLink = new Map<string, string>((links ?? []).map((link: { id: string; product_id: string }) => [link.id, link.product_id]));
    return {
      total: count ?? 0,
      sales: sales.map((sale: { id: string; referral_link_id: string; [key: string]: unknown }) => {
        const payoutId = paidBySale.get(sale.id);
        return { ...sale, product_id: productByLink.get(sale.referral_link_id) ?? null,
          status: payoutId && paidDates.has(payoutId) ? "paid" : "pending",
          paid_at: payoutId ? paidDates.get(payoutId) ?? null : null };
      }),
    };
  });
