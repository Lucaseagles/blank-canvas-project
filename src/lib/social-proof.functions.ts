import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEFAULT_EVENT_TYPES = [
  "SESSION_START",
  "PRODUCT_VIEW",
  "OUTBOUND_CLICK",
  "ADD_FAVORITE",
  "PRICE_ALERT_CONVERSION",
  "video_complete",
];

export const getSocialProofEvents = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const { data: config, error: configError } = await supabaseAdmin
        .from("social_proof_config" as any)
        .select("*")
        .eq("is_enabled", true)
        .single();
      if (configError || !config) return [];

      const recencyMinutes = (config as any).recency_window_minutes || 120;
      const windowStart = new Date(Date.now() - recencyMinutes * 60 * 1000).toISOString();
      const configuredTypes = Array.isArray((config as any).allowed_event_types)
        ? (config as any).allowed_event_types.filter(Boolean)
        : [];
      const eventTypes = configuredTypes.length ? configuredTypes : DEFAULT_EVENT_TYPES;

      const { data: events, error: eventsError } = await supabaseAdmin
        .from("analytics_events")
        .select(`
          id,
          event_type,
          created_at,
          metadata,
          user_id,
          user_preferences:user_id (show_in_social_proof),
          profiles:user_id (display_name, location_city, location_state)
        `)
        .in("event_type", eventTypes)
        .gte("created_at", windowStart)
        .order("created_at", { ascending: false })
        .limit(50);
      if (eventsError) throw eventsError;

      return (events || [])
        .filter((e: any) => {
          const prefs = Array.isArray(e.user_preferences) ? e.user_preferences[0] : e.user_preferences;
          return prefs?.show_in_social_proof !== false;
        })
        .map((e: any) => {
          const profile = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
          let displayName = "Um cliente";
          let location = "";
          if (profile?.display_name) {
            const parts = String(profile.display_name).trim().split(/\s+/).filter(Boolean);
            const firstName = parts[0] || "Cliente";
            const lastNameInitial = parts.length > 1 ? ` ${parts[parts.length - 1]![0]}.` : "";
            displayName = `${firstName}${lastNameInitial}`;
          }
          if ((config as any).show_location && profile?.location_city) {
            location = `de ${profile.location_city}${profile.location_state ? `, ${profile.location_state}` : ''}`;
          }
          const metadata = e.metadata && typeof e.metadata === "object" ? e.metadata : {};
          const productId = metadata.product_id || metadata.productId || null;
          return { id: e.id, type: e.event_type, userName: displayName, location, productId, timestamp: e.created_at };
        })
        .filter((e) => e.userName && (e.type === "SESSION_START" || e.productId));
    } catch (error) {
      console.error("Error fetching social proof events:", error);
      return [];
    }
  });

export const getSocialProofConfig = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const { data } = await supabaseAdmin.from("social_proof_config" as any).select("*").single();
      return data;
    } catch (error) {
      return null;
    }
  });

export const updateSocialProofConfig = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    is_enabled: z.boolean(),
    allowed_event_types: z.array(z.string()),
    min_interval_seconds: z.number(),
    recency_window_minutes: z.number(),
    show_aggregated_counters: z.boolean(),
    min_events_for_counter: z.number(),
    counter_window_hours: z.number(),
    show_location: z.boolean().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const config = await getSocialProofConfig();
    if (!config) return { success: false, error: "Config not found" };
    const { error } = await supabaseAdmin.from("social_proof_config" as any)
      .update({ ...data, updated_at: new Date().toISOString() }).eq("id", (config as any).id);
    return { success: !error };
  });

export const updateSocialProofOptOut = createServerFn({ method: "POST" })
  .validator((data: { userId: string, enabled: boolean }) => z.object({ userId: z.string(), enabled: z.boolean() }).parse(data))
  .handler(async ({ data: { userId, enabled } }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from("user_preferences").update({ show_in_social_proof: enabled } as any).eq("user_id", userId);
    return { success: !error };
  });

export const getAggregatedSocialProof = createServerFn({ method: "GET" })
  .validator((data: any) => z.object({ productId: z.string() }).parse(data))
  .handler(async ({ data: { productId } }) => {
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const config = await getSocialProofConfig();
      if (!config || !(config as any).show_aggregated_counters || !(config as any).is_enabled) return null;
      const windowHours = (config as any).counter_window_hours || 24;
      const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
      const { count: views, error: viewsError } = await supabaseAdmin.from("analytics_events").select("*", { count: 'exact', head: true }).eq("event_type", "PRODUCT_VIEW").eq("metadata->>product_id", productId).gte("created_at", windowStart);
      const { count: favorites, error: favError } = await supabaseAdmin.from("analytics_events").select("*", { count: 'exact', head: true }).eq("event_type", "ADD_FAVORITE").eq("metadata->>product_id", productId).gte("created_at", windowStart);
      const { count: videoCompletions } = await supabaseAdmin.from("analytics_events").select("*", { count: 'exact', head: true }).eq("event_type", "video_complete").eq("metadata->>product_id", productId).gte("created_at", windowStart);
      if (viewsError || favError) throw viewsError || favError;
      const minEvents = (config as any).min_events_for_counter || 5;
      return { views: (views || 0) >= minEvents ? views : 0, favorites: (favorites || 0) >= minEvents ? favorites : 0, videoCompletions: (videoCompletions || 0) >= minEvents ? videoCompletions : 0, windowHours };
    } catch (error) {
      console.error("Error fetching aggregated social proof:", error);
      return null;
    }
  });
