import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { fetchAllFinancialRows, fetchFinancialRowsByIds } from "./financial-pagination.server";

export const getPartnerFinanceSummaryAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({ commercial_profile_id: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const profiles = await fetchAllFinancialRows(() => (supabaseAdmin as any)
      .from("commercial_profiles").select("id,display_name")
      .eq("audience", "partner").order("id", { ascending: true }));
    const links = await fetchAllFinancialRows(() => {
      let query = (supabaseAdmin as any)
        .from("hub_partner_referral_links").select("id,commercial_profile_id");
      if (data.commercial_profile_id) query = query.eq("commercial_profile_id", data.commercial_profile_id);
      return query.order("id", { ascending: true });
    });
    const ids = links.map((link: { id: string }) => link.id);
    if (!ids.length) return { profiles, sales: 0, grossAmount: 0, accruedCommission: 0, paidCommission: 0, pendingCommission: 0, overpaidCommission: 0, overpaidSales: 0, uncommissionedSales: 0 };
    const sales = await fetchFinancialRowsByIds(ids, (batchIds) => (supabaseAdmin as any)
      .from("hub_partner_confirmed_sales").select("id,gross_amount,commission_amount")
      .in("referral_link_id", batchIds).order("id", { ascending: true }));
    const saleIds = sales.map((sale: { id: string }) => sale.id);
    const paid = saleIds.length ? await fetchFinancialRowsByIds(saleIds, (batchIds) => (supabaseAdmin as any)
      .from("hub_partner_commission_payout_items").select("id,sale_id,commission_amount")
      .in("sale_id", batchIds).order("id", { ascending: true })) : [];
    // Work in integer cents and reconcile each sale independently. A global
    // accrued-minus-paid total can hide one overpayment behind another unpaid sale.
    const toCents = (value: unknown) => {
      const amount = Number(value);
      return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
    };
    const paidBySale = new Map<string, number>();
    for (const item of paid as Array<{ sale_id: string; commission_amount: number }>) {
      paidBySale.set(item.sale_id, (paidBySale.get(item.sale_id) ?? 0) + toCents(item.commission_amount));
    }
    const paidCommissionCents = [...paidBySale.values()].reduce((sum, amount) => sum + amount, 0);
    const grossAmountCents = sales.reduce((sum: number, sale: { gross_amount: number }) => sum + toCents(sale.gross_amount), 0);
    const accruedCommissionCents = sales.reduce((sum: number, sale: { commission_amount: number | null }) => sum + toCents(sale.commission_amount), 0);
    const pendingCommissionCents = sales.reduce((sum: number, sale: { id: string; commission_amount: number | null }) =>
      sum + Math.max(0, toCents(sale.commission_amount) - (paidBySale.get(sale.id) ?? 0)), 0);
    const overpaidCommissionCents = sales.reduce((sum: number, sale: { id: string; commission_amount: number | null }) =>
      sum + Math.max(0, (paidBySale.get(sale.id) ?? 0) - toCents(sale.commission_amount)), 0);
    const overpaidSales = sales.filter((sale: { id: string; commission_amount: number | null }) =>
      (paidBySale.get(sale.id) ?? 0) > toCents(sale.commission_amount)
    ).length;
    const uncommissionedSales = sales.filter((sale: { commission_amount: number | null }) =>
      sale.commission_amount === null
    ).length;
    return {
      profiles,
      sales: sales.length,
      grossAmount: grossAmountCents / 100,
      accruedCommission: accruedCommissionCents / 100,
      paidCommission: paidCommissionCents / 100,
      pendingCommission: pendingCommissionCents / 100,
      overpaidCommission: overpaidCommissionCents / 100,
      overpaidSales,
      uncommissionedSales,
    };
  });
