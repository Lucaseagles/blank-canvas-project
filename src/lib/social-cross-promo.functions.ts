import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Platform = z.enum(["tiktok", "instagram", "kwai", "telegram", "youtube"]);
const ExposurePoint = z.enum(["profile", "video_feed", "post_affiliate", "campaign", "gamification"]);
type SocialChannel = { id: string; platform: z.infer<typeof Platform>; channel_name: string; channel_url: string; icon: string | null; is_active: boolean; created_at: string | null };

export const getActiveSocialChannels = createServerFn({ method: "GET" }).handler(async (): Promise<SocialChannel[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).from("social_channels").select("id,platform,channel_name,channel_url,icon,is_active,created_at").eq("is_active", true).order("platform").order("channel_name");
  if (error) throw error;
  return (data ?? []) as SocialChannel[];
});

export const getAdminSocialChannels = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async (): Promise<SocialChannel[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).from("social_channels").select("id,platform,channel_name,channel_url,icon,is_active,created_at").order("platform").order("channel_name");
  if (error) throw error;
  return (data ?? []) as SocialChannel[];
});

export const saveSocialChannel = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ id: z.string().uuid().optional(), platform: Platform, channel_name: z.string().min(2).max(120), channel_url: z.string().url().refine((v) => /^https?:\/\//i.test(v)), icon: z.string().max(40).optional(), is_active: z.boolean().default(true) }).parse(data)).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const payload = { platform: data.platform, channel_name: data.channel_name, channel_url: data.channel_url, icon: data.icon ?? data.platform, is_active: data.is_active, updated_at: new Date().toISOString() };
  const query = data.id ? (supabaseAdmin as any).from("social_channels").update(payload).eq("id", data.id) : (supabaseAdmin as any).from("social_channels").insert(payload);
  const { error } = await query;
  if (error) throw error;
  return { success: true };
});

export const deleteSocialChannel = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data)).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await (supabaseAdmin as any).from("social_channels").delete().eq("id", data.id);
  if (error) throw error;
  return { success: true };
});

export const getCrossPromoAnalytics = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async (): Promise<Array<{ platform: string; exposure_point: string; intent_clicks: number }>> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).rpc("get_social_cross_promo_summary");
  if (error) throw error;
  return (data ?? []) as Array<{ platform: string; exposure_point: string; intent_clicks: number }>;
});

export const trackFollowIntent = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data: unknown) => z.object({ platform: Platform, exposurePoint: ExposurePoint, channelId: z.string().uuid().optional() }).parse(data)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await (supabaseAdmin as any).from("analytics_events").insert({ user_id: context.userId, event_type: "FOLLOW_CLICK", event_name: "FOLLOW_CLICK", follow_intent_platform: data.platform, metadata: { exposure_point: data.exposurePoint, channel_id: data.channelId ?? null } });
  if (error) throw error;
  return { success: true, metric: "intent_click" as const };
});
