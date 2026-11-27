import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const UUID = z.string().uuid();

async function logAutomationActivity(
  supabaseAdmin: typeof import("@/integrations/supabase/client.server").supabaseAdmin,
  ruleId: string,
  context: Record<string, unknown>,
  result: string,
  status: "success" | "failed" | "queued_for_review" | "skipped",
) {
  const { error } = await supabaseAdmin.rpc("log_automation_activity", {
    _rule_id: ruleId,
    _context: context as any,
    _result: result,
    _status: status,
  });
  if (error) throw error;
}

export const getAutomationRules = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("automation_rules").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const toggleRuleStatus = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ id: UUID, isActive: z.boolean() }).parse(data)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: current, error: readError } = await supabaseAdmin.from("automation_rules").select("id,is_active").eq("id", data.id).maybeSingle();
  if (readError) throw readError;
  if (!current) throw new Error("Regra de automação não encontrada.");
  const { data: updated, error } = await (supabaseAdmin as any).rpc("rubi_update_admin_setting_audited", {
    p_source: "automation_rules",
    p_id: data.id,
    p_patch: { is_active: data.isActive },
    p_expected: { is_active: current.is_active },
    p_actor: context.userId,
  });
  if (error) throw error;
  if (!updated) throw new Error("Status e auditoria da regra não foram registrados.");
  return { success: true, id: String(updated.id), is_active: Boolean(updated.is_active) };
});

export const getAutomationLogs = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) }).parse(data ?? {})).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: logs, error } = await supabaseAdmin.from("automation_logs").select("id,rule_id,triggered_at,context,result,status,automation_rules(name)").order("triggered_at", { ascending: false }).limit(data.limit);
  if (error) throw error;
  return logs ?? [];
});

export const recalculateTrendingManual = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).rpc("rubi_recalculate_trending_audited", {
    p_actor: context.userId,
  });
  if (error) throw error;
  return data as { success: boolean; processed: number; error?: string };
});

export const runRetentionCheck = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).rpc("rubi_run_automation_action_audited", {
    p_action: "RUN_RETENTION_CHECK",
    p_actor: context.userId,
  });
  if (error) throw error;
  return data as { success: boolean; notifications_queued: number; error?: string };
});

export const processVideoLaunches = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const { data: rule, error: ruleError } = await supabaseAdmin.from("automation_rules").select("id,is_active").eq("action_type", "PUBLISH_SCHEDULED_POSTS").maybeSingle();
  if (ruleError) throw ruleError;
  if (!rule) return { success: false, processed: 0, queued: 0, already_queued: 0, unsupported: 0, error: "Scheduled publishing rule not found" };
  if (!rule.is_active) return { success: false, processed: 0, queued: 0, already_queued: 0, unsupported: 0, error: "Scheduled publishing rule is disabled" };

  const { data: scheduledVideos, error } = await supabaseAdmin.from("videos")
    .select("id,title,campaign_id,scheduled_for")
    .eq("status", "draft")
    .not("scheduled_for", "is", null)
    .lte("scheduled_for", now);
  if (error) throw error;

  let processed = 0;
  let queued = 0;
  let alreadyQueued = 0;
  let unsupported = 0;

  for (const video of scheduledVideos ?? []) {
    const { data: outcome, error: launchError } = await (supabaseAdmin as any).rpc("rubi_process_due_video_launch_audited", {
      p_video_id: video.id,
      p_actor: context.userId,
    });
    if (launchError) throw new Error(`Não foi possível publicar o vídeo ${video.id}: ${launchError.message}`);
    const result = outcome as {
      status?: string;
      queued?: boolean;
      already_queued?: boolean;
      unsupported_channels?: string[];
    } | null;

    if (!result || result.status === "not_due" || result.status === "already_processed") continue;
    if (result.status !== "published") throw new Error("Resultado inesperado ao processar publicação de vídeo.");

    processed++;
    if (result.queued) queued++;
    if (result.already_queued) alreadyQueued++;
    const unsupportedChannels = Array.isArray(result.unsupported_channels) ? result.unsupported_channels : [];
    unsupported += unsupportedChannels.length;

    if (!video.campaign_id) {
      await logAutomationActivity(supabaseAdmin, rule.id, { video_id: video.id, type: "VIDEO_LAUNCH" }, "Vídeo publicado sem campanha vinculada", "skipped");
      continue;
    }
    if (unsupportedChannels.length) {
      await logAutomationActivity(
        supabaseAdmin,
        rule.id,
        { campaign_id: video.campaign_id, video_id: video.id, channels: unsupportedChannels, type: "VIDEO_LAUNCH" },
        `Canais sem adapter de publicação: ${unsupportedChannels.join(", ")}`,
        "queued_for_review",
      );
    } else {
      await logAutomationActivity(
        supabaseAdmin,
        rule.id,
        { campaign_id: video.campaign_id, video_id: video.id, queued_telegram: Boolean(result.queued || result.already_queued) },
        result.queued ? "Vídeo publicado e publicação Telegram enfileirada" :
          result.already_queued ? "Vídeo publicado; publicação Telegram já estava enfileirada" :
          "Vídeo publicado; nenhum canal com adapter disponível",
        result.queued || result.already_queued ? "success" : "skipped",
      );
    }
  }

  if (processed === 0) {
    await logAutomationActivity(supabaseAdmin, rule.id, { triggered_by: "automation_run" }, "Nenhum vídeo agendado estava pronto para publicação", "skipped");
  }

  return { success: true, processed, queued, already_queued: alreadyQueued, unsupported };
});
