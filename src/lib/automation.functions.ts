import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const UUID = z.string().uuid();

export const getAutomationRules = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("automation_rules").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const toggleRuleStatus = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ id: UUID, isActive: z.boolean() }).parse(data)).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: updated, error } = await supabaseAdmin.from("automation_rules").update({ is_active: data.isActive, updated_at: new Date().toISOString() }).eq("id", data.id).select("id,is_active").single();
  if (error) throw error;
  return { success: true, ...updated };
});

export const getAutomationLogs = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) }).parse(data ?? {})).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: logs, error } = await supabaseAdmin.from("automation_logs").select("id,rule_id,triggered_at,context,result,status,automation_rules(name)").order("triggered_at", { ascending: false }).limit(data.limit);
  if (error) throw error;
  return logs ?? [];
});

export const recalculateTrendingManual = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rule, error: ruleError } = await supabaseAdmin.from("automation_rules").select("id,is_active").eq("action_type", "RECALCULATE_TRENDING").maybeSingle();
  if (ruleError) throw ruleError;
  if (!rule) return { success: false, processed: 0, error: "Trending rule not found" };
  if (!rule.is_active) return { success: false, processed: 0, error: "Trending rule is disabled" };
  const { error: refreshError } = await supabaseAdmin.rpc("refresh_demand_and_trend_scores");
  if (refreshError) {
    await supabaseAdmin.rpc("log_automation_activity", { _rule_id: rule.id, _context: { triggered_by: "admin_manual" }, _result: refreshError.message, _status: "failed" });
    throw refreshError;
  }
  const { count, error: countError } = await supabaseAdmin.from("products").select("id", { count: "exact", head: true });
  if (countError) throw countError;
  const { error: logError } = await supabaseAdmin.rpc("log_automation_activity", { _rule_id: rule.id, _context: { triggered_by: "admin_manual" }, _result: `Trending scores refreshed for ${count ?? 0} products`, _status: "success" });
  if (logError) throw logError;
  return { success: true, processed: count ?? 0 };
});

export const runRetentionCheck = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rule, error: ruleError } = await supabaseAdmin.from("automation_rules").select("id,is_active").eq("trigger_type", "USER_INACTIVE").maybeSingle();
  if (ruleError) throw ruleError;
  if (!rule) return { success: false, notifications_queued: 0, error: "Retention rule not found" };
  if (!rule.is_active) return { success: false, notifications_queued: 0, error: "Retention rule is disabled" };
  const { data: queued, error } = await supabaseAdmin.rpc("run_retention_engine", { _inactive_days: 3 });
  if (error) {
    await supabaseAdmin.rpc("log_automation_activity", { _rule_id: rule.id, _context: { inactive_days: 3, triggered_by: "admin_manual" }, _result: error.message, _status: "failed" });
    throw error;
  }
  return { success: true, notifications_queued: Number(queued ?? 0) };
});

export const processVideoLaunches = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const { data: scheduledVideos, error } = await supabaseAdmin.from("videos").select("id,title,campaign_id,scheduled_for").eq("status", "draft").not("scheduled_for", "is", null).lte("scheduled_for", now);
  if (error) throw error;
  let processed = 0;
  for (const video of scheduledVideos ?? []) {
    const { error: publishError } = await supabaseAdmin.from("videos").update({ status: "published" }).eq("id", video.id).eq("status", "draft");
    if (publishError) throw publishError;
    processed++;
    if (!video.campaign_id) continue;
    const { data: channels, error: channelsError } = await supabaseAdmin.from("campaign_channels").select("channel").eq("campaign_id", video.campaign_id).eq("is_enabled", true);
    if (channelsError) throw channelsError;
    const { data: rule, error: ruleError } = await supabaseAdmin.from("automation_rules").select("id").eq("action_type", "PUBLISH_SCHEDULED_POSTS").maybeSingle();
    if (ruleError) throw ruleError;
    if (!rule) continue;
    for (const channel of channels ?? []) {
      const { error: logError } = await supabaseAdmin.rpc("log_automation_activity", { _rule_id: rule.id, _context: { campaign_id: video.campaign_id, video_id: video.id, channel: channel.channel, type: "VIDEO_LAUNCH" }, _result: `Video published; ${channel.channel} dispatch requires configured channel adapter`, _status: "queued_for_review" });
      if (logError) throw logError;
    }
  }
  return { success: true, processed };
});
