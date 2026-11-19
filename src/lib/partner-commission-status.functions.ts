import { fetchAllFinancialRows, fetchFinancialRowsByIds } from "./financial-pagination.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMyPartnerCommissionStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Autenticação indisponível.");
    const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: claims, error } = await auth.auth.getClaims(data.accessToken);
    if (error || !claims?.claims?.sub) throw new Error("Sessão inválida.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await (supabaseAdmin as any).from("commercial_profiles")
      .select("id").eq("user_id", claims.claims.sub).eq("audience", "partner").eq("status", "approved").maybeSingle();
    if (profileError) throw profileError;
    const empty = { calculated: 0, paid: 0, pending: 0, overpaid: 0, paidSales: 0, unpaidSales: 0, overpaidSales: 0 };
    if (!profile) return empty;
    const links = await fetchAllFinancialRows(() => (supabaseAdmin as any).from("hub_partner_referral_links")
      .select("id").eq("commercial_profile_id", profile.id).order("id", { ascending: true }));
    if (!links?.length) return empty;
    const sales = await fetchFinancialRowsByIds(links.map((link: { id: string }) => link.id), (ids) => (supabaseAdmin as any).from("hub_partner_confirmed_sales")
      .select("id,commission_amount").in("referral_link_id", ids).order("id", { ascending: true }));
    if (!sales?.length) return empty;
    const items = await fetchFinancialRowsByIds(sales.map((sale: { id: string }) => sale.id), (ids) => (supabaseAdmin as any).from("hub_partner_commission_payout_items")
      .select("id,sale_id,commission_amount").in("sale_id", ids).order("id", { ascending: true }));

    // Integer cents and per-sale reconciliation keep partial payments and overpayments visible.
    const toCents = (value: unknown) => {
      const amount = Number(value);
      return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
    };
    const paidBySale = new Map<string, number>();
    for (const item of items ?? []) {
      const saleId = String(item.sale_id);
      paidBySale.set(saleId, (paidBySale.get(saleId) ?? 0) + toCents(item.commission_amount));
    }
    const calculatedCents = sales.reduce((sum: number, sale: { commission_amount: number | null }) =>
      sum + toCents(sale.commission_amount), 0);
    const paidCents = (items ?? []).reduce((sum: number, item: { commission_amount: number }) =>
      sum + toCents(item.commission_amount), 0);
    const pendingCents = sales.reduce((sum: number, sale: { id: string; commission_amount: number | null }) =>
      sum + Math.max(0, toCents(sale.commission_amount) - (paidBySale.get(sale.id) ?? 0)), 0);
    const overpaidCents = sales.reduce((sum: number, sale: { id: string; commission_amount: number | null }) =>
      sum + Math.max(0, (paidBySale.get(sale.id) ?? 0) - toCents(sale.commission_amount)), 0);
    const paidSales = sales.filter((sale: { id: string; commission_amount: number | null }) => {
      const commission = toCents(sale.commission_amount);
      return commission > 0 && (paidBySale.get(sale.id) ?? 0) >= commission;
    }).length;
    const overpaidSales = sales.filter((sale: { id: string; commission_amount: number | null }) =>
      (paidBySale.get(sale.id) ?? 0) > toCents(sale.commission_amount)
    ).length;

    return {
      calculated: calculatedCents / 100,
      paid: paidCents / 100,
      pending: pendingCents / 100,
      overpaid: overpaidCents / 100,
      paidSales,
      unpaidSales: sales.length - paidSales,
      overpaidSales,
    };
  });
