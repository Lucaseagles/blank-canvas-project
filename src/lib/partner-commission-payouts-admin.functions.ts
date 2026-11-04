import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getPartnerCommissionPayoutsAdmin = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({ commercial_profile_id: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let payoutQuery = (supabaseAdmin as any).from("hub_partner_commission_payouts")
      .select("id,commercial_profile_id,payment_reference,paid_amount,paid_at,note")
      .order("paid_at", { ascending: false }).limit(200);
    if (data.commercial_profile_id) payoutQuery = payoutQuery.eq("commercial_profile_id", data.commercial_profile_id);
    const [payouts, items] = await Promise.all([
      payoutQuery,
      (supabaseAdmin as any).from("hub_partner_commission_payout_items")
        .select("payout_id,sale_id,commission_amount").limit(1000),
    ]);
    if (payouts.error) throw payouts.error;
    if (items.error) throw items.error;
    const ids = new Set((payouts.data ?? []).map((payout: { id: string }) => payout.id));
    return {
      payouts: payouts.data ?? [],
      items: (items.data ?? []).filter((item: { payout_id: string }) => ids.has(item.payout_id)),
    };
  });
