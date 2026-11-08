import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { fetchAllFinancialRows } from "./financial-pagination.server";

export const getPartnerSalesReconciliationAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profiles, links, sales] = await Promise.all([
      fetchAllFinancialRows(() => (supabaseAdmin as any)
        .from("commercial_profiles").select("id,display_name,status")
        .eq("audience", "partner").order("id", { ascending: true })),
      fetchAllFinancialRows(() => (supabaseAdmin as any)
        .from("hub_partner_referral_links").select("id,commercial_profile_id,product_id,active")
        .order("id", { ascending: true })),
      fetchAllFinancialRows(() => (supabaseAdmin as any)
        .from("hub_partner_confirmed_sales")
        .select("id,referral_link_id,external_order_id,source,gross_amount,commission_amount,confirmed_at")
        .order("id", { ascending: true })),
    ]);
    return { profiles, links, sales };
  });

export const reconcilePartnerSaleAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    referral_link_id: z.string().uuid(),
    external_order_id: z.string().trim().min(3).max(150),
    gross_amount: z.number().positive().max(10000000),
    confirmed_by_admin: z.literal(true),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error: linkError } = await (supabaseAdmin as any)
      .from("hub_partner_referral_links").select("id,commercial_profile_id,product_id,active")
      .eq("id", data.referral_link_id).maybeSingle();
    if (linkError) throw linkError;
    if (!link?.active) throw new Error("Link de parceiro inexistente ou desativado.");
    const [profileResult, grantResult, agreementResult] = await Promise.all([
      (supabaseAdmin as any).from("commercial_profiles").select("status").eq("id", link.commercial_profile_id).eq("audience", "partner").maybeSingle(),
      (supabaseAdmin as any).from("hub_partner_product_grants").select("id").eq("commercial_profile_id", link.commercial_profile_id).eq("product_id", link.product_id).eq("active", true).maybeSingle(),
      (supabaseAdmin as any).from("hub_partner_agreements").select("commission_percent,active").eq("commercial_profile_id", link.commercial_profile_id).maybeSingle(),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (grantResult.error) throw grantResult.error;
    if (agreementResult.error) throw agreementResult.error;
    if (profileResult.data?.status !== "approved" || !grantResult.data || !agreementResult.data?.active)
      throw new Error("Parceiro, produto ou acordo não está autorizado.");
    const { data: existing, error: existingError } = await (supabaseAdmin as any)
      .from("hub_partner_confirmed_sales").select("id").eq("source", "admin_reconciliation")
      .eq("external_order_id", data.external_order_id).maybeSingle();
    if (existingError) throw existingError;
    if (existing) throw new Error("Este pedido já foi conciliado.");
    const { data: sale, error: saleError } = await (supabaseAdmin as any)
      .from("hub_partner_confirmed_sales").insert({
        referral_link_id: link.id,
        external_order_id: data.external_order_id,
        source: "admin_reconciliation",
        gross_amount: data.gross_amount,
        commission_percent: Number(agreementResult.data.commission_percent),
      }).select("id").single();
    if (saleError) throw saleError;
    return { id: sale.id as string };
  });
