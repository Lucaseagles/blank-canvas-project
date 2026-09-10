import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const StrategyInput = z.object({
  id: z.string().uuid().optional(),
  channel_id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  category_id: z.string().uuid().optional().nullable(),
  collection_id: z.string().uuid().optional().nullable(),
  campaign_id: z.string().uuid().optional().nullable(),
  audience_segment: z.string().trim().max(120).optional().nullable(),
  objective: z.enum(["traffic", "engagement", "followers", "conversion", "awareness"]),
  content_pillars: z.array(z.string().trim().min(1).max(80)).max(10),
  preferred_formats: z.array(z.string().trim().min(1).max(40)).max(10),
  posting_frequency_per_week: z.number().int().min(1).max(50),
  cta: z.string().trim().max(160).optional().nullable(),
  priority: z.number().int().min(0).max(100),
  is_active: z.boolean(),
});

export type SocialStrategy = {
  id: string;
  channel_id: string;
  name: string;
  category_id: string | null;
  collection_id: string | null;
  campaign_id: string | null;
  audience_segment: string | null;
  objective: string;
  content_pillars: string[];
  preferred_formats: string[];
  posting_frequency_per_week: number;
  cta: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  channel?: { channel_name: string; platform: string } | null;
  category?: { name: string } | null;
  collection?: { title: string } | null;
  campaign?: { name: string } | null;
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export const listSocialStrategies = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async (): Promise<SocialStrategy[]> => {
    const supabase = await db();
    const { data, error } = await supabase
      .from("social_channel_strategies")
      .select("*, channel:social_channels(channel_name,platform), category:categories(name), collection:curated_collections(title), campaign:campaigns(name)")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SocialStrategy[];
  });

export const getSocialStrategyOptions = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const supabase = await db();
    const { data, error } = await supabase.rpc("get_social_strategy_options");
    if (error) throw error;
    return (data ?? { channels: [], categories: [], collections: [], campaigns: [], segments: [] }) as {
      channels: Array<{ id: string; name: string; platform: string }>;
      categories: Array<{ id: string; name: string }>;
      collections: Array<{ id: string; title: string }>;
      campaigns: Array<{ id: string; name: string; status: string }>;
      segments: Array<{ value: string }>;
    };
  });

export const getSocialStrategyOverview = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const supabase = await db();
    const { data, error } = await supabase.rpc("get_social_strategy_overview");
    if (error) throw error;
    return (data ?? { total: 0, active: 0, channels_covered: 0, with_collection: 0, with_campaign: 0, with_segment: 0 }) as {
      total: number; active: number; channels_covered: number; with_collection: number; with_campaign: number; with_segment: number;
    };
  });

export const saveSocialStrategy = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => StrategyInput.parse(data))
  .handler(async ({ data }) => {
    const supabase = await db();
    const payload = {
      channel_id: data.channel_id,
      name: data.name,
      category_id: data.category_id ?? null,
      collection_id: data.collection_id ?? null,
      campaign_id: data.campaign_id ?? null,
      audience_segment: data.audience_segment || null,
      objective: data.objective,
      content_pillars: data.content_pillars,
      preferred_formats: data.preferred_formats,
      posting_frequency_per_week: data.posting_frequency_per_week,
      cta: data.cta || null,
      priority: data.priority,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    };
    const query = data.id
      ? supabase.from("social_channel_strategies").update(payload).eq("id", data.id)
      : supabase.from("social_channel_strategies").insert(payload);
    const { error } = await query;
    if (error) throw error;
    return { success: true };
  });

export const deleteSocialStrategy = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = await db();
    const { error } = await supabase.from("social_channel_strategies").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });
