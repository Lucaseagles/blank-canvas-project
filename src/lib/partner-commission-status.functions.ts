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
  const empty = { calculated: 0, paid: 0, pending: 0, paidSales: 0, unpaidSales: 0 };
  if (!profile) return empty;
  const { data: links, error: linksError } = await (supabaseAdmin as any).from("hub_partner_referral_links")
    .select("id").eq("commercial_profile_id", profile.id).limit(500);
  if (linksError) throw linksError;
  if (!links?.length) return empty;
  const { data: sales, error: salesError } = await (supabaseAdmin as any).from("hub_partner_confirmed_sales")
    .select("id,commission_amount").in("referral_link_id", links.map((link: { id: string }) => link.id)).limit(10000);
  if (salesError) throw salesError;
  if (!sales?.length) return empty;
  const { data: items, error: itemsError } = await (supabaseAdmin as any).from("hub_partner_commission_payout_items")
    .select("sale_id,commission_amount").in("sale_id", sales.map((sale: { id: string }) => sale.id)).limit(10000);
  if (itemsError) throw itemsError;
  const paidIds = new Set((items ?? []).map((item: { sale_id: string }) => item.sale_id));
  const calculated = sales.reduce((sum: number, sale: { commission_amount: number }) => sum + Number(sale.commission_amount), 0);
  const paid = (items ?? []).reduce((sum: number, item: { commission_amount: number }) => sum + Number(item.commission_amount), 0);
  return { calculated, paid, pending: Math.max(0, calculated - paid), paidSales: paidIds.size,
    unpaidSales: sales.filter((sale: { id: string }) => !paidIds.has(sale.id)).length };
});
