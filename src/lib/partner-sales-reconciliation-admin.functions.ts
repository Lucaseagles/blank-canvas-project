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
    provider_name: z.string().trim().min(2).max(100),
    payment_evidence_reference: z.string().trim().min(8).max(500),
    payment_verified_at: z.string().datetime({ offset: true }),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saleId, error } = await (supabaseAdmin as any).rpc("rubi_reconcile_partner_sale_audited", {
      p_referral_link_id: data.referral_link_id,
      p_external_order_id: data.external_order_id,
      p_gross_amount: data.gross_amount,
      p_provider_name: data.provider_name,
      p_payment_evidence_reference: data.payment_evidence_reference,
      p_payment_verified_at: data.payment_verified_at,
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    if (typeof saleId !== "string") throw new Error("A conciliação não retornou o identificador da venda.");
    return { id: saleId };
  });
