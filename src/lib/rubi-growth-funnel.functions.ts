import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "./auth-guards.server";

const funnelEvents = [
  "RUBI_STORE_PRODUCT_VIEW",
  "RUBI_SIGNUP_INVITE_SHOWN",
  "RUBI_SIGNUP_INVITE_ACTION",
  "RUBI_POST_SIGNUP_ACTIVATION",
  "RUBI_PRECHECKOUT_CONTINUE",
] as const;

const signupActions = ["continue_to_auth", "dismiss"] as const;
const activationActions = [
  "guide_shown",
  "push_cta_clicked",
  "install_cta_clicked",
  "install_prompt_accepted",
  "appinstalled_browser_event",
] as const;

/**
 * Aggregate operational signals for the owner over the last 30 days.
 * Counts are events, not unique users, confirmed signups, deliveries, orders or revenue.
 * Queries are intentionally performed in the authenticated server function; no raw
 * anonymous/session identifiers or referral records are returned to the dashboard.
 */
export const getRubiGrowthFunnelAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const countEvent = async (name: string, action?: string): Promise<number> => {
      let query = (supabaseAdmin as any)
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_name", name)
        .gte("created_at", since);
      if (action) query = query.eq("metadata->>action", action);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    };

    const [eventCounts, signupCounts, activationCounts] = await Promise.all([
      Promise.all(funnelEvents.map(name => countEvent(name))),
      Promise.all(signupActions.map(action => countEvent("RUBI_SIGNUP_INVITE_ACTION", action))),
      Promise.all(activationActions.map(action => countEvent("RUBI_POST_SIGNUP_ACTIVATION", action))),
    ]);

    return {
      days: 30,
      events: Object.fromEntries(funnelEvents.map((name, index) => [name, eventCounts[index]])) as Record<typeof funnelEvents[number], number>,
      signupActions: Object.fromEntries(signupActions.map((name, index) => [name, signupCounts[index]])) as Record<typeof signupActions[number], number>,
      activationActions: Object.fromEntries(activationActions.map((name, index) => [name, activationCounts[index]])) as Record<typeof activationActions[number], number>,
    };
  });
