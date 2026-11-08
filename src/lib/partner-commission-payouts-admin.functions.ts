import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { fetchAllFinancialRows, fetchFinancialRowsByIds } from "./financial-pagination.server";

export const getPartnerCommissionPayoutsAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({ commercial_profile_id: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payouts = await fetchAllFinancialRows(() => {
      let query = (supabaseAdmin as any).from("hub_partner_commission_payouts")
        .select("id,commercial_profile_id,payment_reference,paid_amount,paid_at,note");
      if (data.commercial_profile_id) query = query.eq("commercial_profile_id", data.commercial_profile_id);
      return query.order("id", { ascending: true });
    });
    const payoutIds = payouts.map((payout: { id: string }) => payout.id);
    const items = payoutIds.length ? await fetchFinancialRowsByIds(payoutIds, (batchIds) =>
      (supabaseAdmin as any).from("hub_partner_commission_payout_items")
        .select("id,payout_id,sale_id,commission_amount")
        .in("payout_id", batchIds).order("id", { ascending: true })) : [];
    return { payouts, items };
  });
