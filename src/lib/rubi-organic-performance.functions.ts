import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "./auth-guards.server";
import { RUBI_ORGANIC_CHANNELS } from "./rubi-organic-campaigns";

export type RubiOrganicCampaignRow = {
  productId: string;
  productTitle: string;
  channel: string;
  campaign: string;
  viewEvents: number;
  viewSessions: number;
  checkoutIntents: number;
};

const allowedChannels = new Set<string>(RUBI_ORGANIC_CHANNELS.map(item => item.id));

/**
 * Owner-only dashboard of organic event counts in the last 30 days.
 * Counts are aggregate event records, not real customers, paid orders or GMV.
 * The database routine is service-role-only and never returns visitor identities.
 */
export const getRubiOrganicCampaignPerformanceAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .rpc("rubi_organic_campaign_performance", { p_days: 30, p_limit: 100 });
    if (error) throw error;
    const rows: RubiOrganicCampaignRow[] = ((data ?? []) as Array<Record<string, unknown>>)
      .filter(row => typeof row["product_id"] === "string"
        && typeof row["channel"] === "string" && allowedChannels.has(row["channel"])
        && typeof row["campaign"] === "string")
      .map(row => ({
        productId: String(row["product_id"]),
        productTitle: String(row["product_title"] ?? "Produto indisponível"),
        channel: String(row["channel"]),
        campaign: String(row["campaign"]),
        viewEvents: Number(row["view_events"] ?? 0),
        viewSessions: Number(row["view_sessions"] ?? 0),
        checkoutIntents: Number(row["checkout_intents"] ?? 0),
      }));
    return { days: 30, cappedAt: 100, asOf: new Date().toISOString(), rows };
  });
