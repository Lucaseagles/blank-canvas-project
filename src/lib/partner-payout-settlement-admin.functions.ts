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
    const items = await fetchFinancialRowsByIds(sales.map((sale: { id: string }) => sale.id), (ids) => (supabaseAdmin as any)
      .from("hub_partner_commission_payout_items").select("id,sale_id,commission_amount")
      .in("sale_id", ids).order("id", { ascending: true }));
    const paidBySale = new Map<string, number>();
    for (const item of items ?? []) paidBySale.set(item.sale_id, (paidBySale.get(item.sale_id) ?? 0) + Number(item.commission_amount));
    return sales.map((sale: { id: string; commission_amount: number; external_order_id: string }) => ({
      ...sale,
      paid_amount: paidBySale.get(sale.id) ?? 0,
      remaining_amount: Math.max(0, Number(sale.commission_amount) - (paidBySale.get(sale.id) ?? 0)),
    })).filter((sale: { remaining_amount: number }) => sale.remaining_amount > 0.005);
  });

export const settlePartnerCommissionsAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    commercial_profile_id: z.string().uuid(),
    allocations: z.array(z.object({ sale_id: z.string().uuid(), amount: z.number().positive().finite() })).min(1).max(100),
    payment_reference: z.string().trim().min(3).max(150),
    paid_at: z.string().datetime({ offset: true }),
    note: z.string().max(500).optional(),
    payment_verified: z.literal(true),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payoutId, error } = await (supabaseAdmin as any).rpc("hub_settle_partner_commissions", {
      p_profile_id: data.commercial_profile_id,
      p_allocations: data.allocations,
      p_payment_reference: data.payment_reference,
      p_paid_at: data.paid_at,
      p_note: data.note ?? null,
      p_actor: context.userId,
    });
    if (error) {
      // Production may still expose the legacy UUID[]/five-argument RPC.
      // Never fall back to it: it cannot preserve the audited installment contract.
      if (error.code === "PGRST202" || error.code === "42883") {
        throw new Error(
          "Repasse parcial temporariamente indisponível: o banco ainda não possui a versão compatível da operação financeira. Nenhum repasse foi registrado. Solicite a atualização controlada do banco.",
        );
      }
      throw error;
    }
    return { payoutId: payoutId as string };
  });
