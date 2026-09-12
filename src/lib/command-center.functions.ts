import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const ToggleFeatureSchema = z.object({
  id: z.string().uuid(),
  is_enabled: z.boolean(),
});

export const getCommandCenterPulse = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 7 * 86400000).toISOString();

    const [{ data: flags, error: flagsError }, { data: events, error: eventsError }, { count: experiments, error: experimentsError }] = await Promise.all([
      supabaseAdmin.from("feature_flags").select("id,key,is_enabled").order("key"),
      supabaseAdmin
        .from("analytics_events")
        .select("event_name,campaign_id,created_at,metadata")
        .in("event_name", [
          "recommendation_view",
          "recommendation_click",
          "popup_view",
          "popup_click",
          "promotion_view",
          "promotion_click",
        ])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabaseAdmin.from("ab_experiments").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

    if (flagsError) throw new Error(`Command Center feature flags query failed: ${flagsError.message}`);
    if (eventsError) throw new Error(`Command Center analytics query failed: ${eventsError.message}`);
    if (experimentsError) throw new Error(`Command Center experiments query failed: ${experimentsError.message}`);

    return {
      flags: flags ?? [],
      events: events ?? [],
      activeExperiments: experiments ?? 0,
      generatedAt: new Date().toISOString(),
    };
  });

export const setCommandCenterFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => ToggleFeatureSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("feature_flags")
      .update({ is_enabled: data.is_enabled, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("id,key,is_enabled")
      .maybeSingle();

    if (error) throw new Error(`Feature flag update failed: ${error.message}`);
    if (!updated) throw new Error("Feature flag não encontrada.");
    return updated;
  });
