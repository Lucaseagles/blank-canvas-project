import { fetchAllFinancialRows, fetchFinancialRowsByIds } from "./financial-pagination.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getUnpaidPartnerCommissionsAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({ commercial_profile_id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const links = await fetchAllFinancialRows(() => (supabaseAdmin as any).from("hub_partner_referral_links")
      .select("id").eq("commercial_profile_id", data.commercial_profile_id).order("id", { ascending: true }));
    if (!links?.length) return [];
    const sales = await fetchFinancialRowsByIds(links.map((link: { id: string }) => link.id), (ids) => (supabaseAdmin as any)
      .from("hub_partner_confirmed_sales").select("id,external_order_id,commission_amount,confirmed_at")
      .in("referral_link_id", ids).order("id", { ascending: true }));
    if (!sales?.length) return [];
    const paid = await fetchFinancialRowsByIds(sales.map((sale: { id: string }) => sale.id), (ids) => (supabaseAdmin as any)
      .from("hub_partner_commission_payout_items").select("id,sale_id")
      .in("sale_id", ids).order("id", { ascending: true }));
    const paidIds = new Set((paid ?? []).map((item: { sale_id: string }) => item.sale_id));
    return sales.filter((sale: { id: string; commission_amount: number }) => !paidIds.has(sale.id) && Number(sale.commission_amount) > 0);
  });

export const settlePartnerCommissionsAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    commercial_profile_id: z.string().uuid(),
    sale_ids: z.array(z.string().uuid()).min(1).max(100),
    payment_reference: z.string().trim().min(3).max(150),
    paid_at: z.string().datetime({ offset: true }),
    note: z.string().max(500).optional(),
    payment_verified: z.literal(true),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payoutId, error } = await (supabaseAdmin as any).rpc("hub_settle_partner_commissions", {
      p_profile_id: data.commercial_profile_id,
      p_sale_ids: data.sale_ids,
      p_payment_reference: data.payment_reference,
      p_paid_at: data.paid_at,
      p_note: data.note ?? null,
    });
    if (error) throw error;
    return { payoutId: payoutId as string };
  });
