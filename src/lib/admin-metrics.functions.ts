import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { getIntegrationSecretServer } from "@/integrations/secrets.server";

export type ExternalMetric = { id: string; channel_id: string; metric_type: string; value: number; collected_at: string; channel_name?: string; platform?: string };
export type ExternalChannel = { id: string; platform: string; channel_name: string; channel_url: string; icon: string | null; is_active: boolean };

const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;

export const getExternalMetrics = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const client = await db();
  const { data, error } = await client.from("external_channel_metrics").select("id,channel_id,metric_type,value,collected_at,social_channels:channel_id(channel_name,platform)").order("collected_at", { ascending: false }).limit(250);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({ ...row, channel_name: row.social_channels?.channel_name ?? "Canal", platform: row.social_channels?.platform ?? "unknown" })) as ExternalMetric[];
});

export const getExternalChannels = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const client = await db();
  const { data, error } = await client.from("social_channels").select("id,platform,channel_name,channel_url,icon,is_active").eq("is_active", true).order("channel_name");
  if (error) throw new Error(error.message);
  return (data ?? []) as ExternalChannel[];
});

export const collectTelegramMetric = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((v: unknown) => z.object({ channelId: z.string().uuid().optional() }).parse(v ?? {})).handler(async ({ data }) => {
  const token = await getIntegrationSecretServer("telegram", "bot_token");
  const configuredChannelId = await getIntegrationSecretServer("telegram", "channel_id");
  if (!token) throw new Error("Bot Token do Telegram não configurado.");
  const channelId = data.channelId || configuredChannelId;
  if (!channelId) throw new Error("Channel ID do Telegram não configurado.");
  const response = await fetch(`https://api.telegram.org/bot${token}/getChatMemberCount?chat_id=${encodeURIComponent(channelId)}`);
  if (!response.ok) throw new Error(`Telegram respondeu HTTP ${response.status}.`);
  const result = await response.json() as { ok: boolean; result?: number; description?: string };
  if (!result.ok || typeof result.result !== "number") throw new Error(result.description ?? "Não foi possível obter a quantidade de membros.");
  const client = await db();
  const { data: channels, error: channelError } = await client.from("social_channels").select("id,platform,channel_name").eq("is_active", true).eq("platform", "telegram").order("created_at", { ascending: true }).limit(1);
  if (channelError) throw new Error(channelError.message);
  const channel = channels?.[0];
  if (!channel) throw new Error("Nenhum canal Telegram ativo cadastrado.");
  const { data: metric, error } = await client.from("external_channel_metrics").insert({ channel_id: channel.id, metric_type: "member_count", value: result.result }).select("id,channel_id,metric_type,value,collected_at").single();
  if (error) throw new Error(error.message);
  await client.from("admin_audit_log").insert({ actor_user_id: null, actor_email: "eaglesfr49@gmail.com", action_type: "TELEGRAM_METRIC_COLLECTED", entity_type: "external_channel_metric", entity_id: metric.id, previous_value: null, new_value: { channel_id: channel.id, metric_type: "member_count", value: result.result } });
  return metric as ExternalMetric;
});
