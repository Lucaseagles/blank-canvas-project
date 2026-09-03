import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "./auth-guards.server";
import { getIntegrationSecretServer } from "@/integrations/secrets.server";

export type ExternalMetric = {
  id: string;
  channel_id: string | null;
  metric_type: string;
  value: number;
  collected_at: string;
  channel_name?: string;
  platform?: string;
};

export type ExternalChannel = {
  id: string;
  platform: string;
  channel_name: string;
  channel_url: string;
  icon: string | null;
  is_active: boolean;
};

const getDb = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;

export const getExternalMetrics = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from("external_channel_metrics")
      .select("id,channel_id,metric_type,value,collected_at,social_channels:channel_id(channel_name,platform)")
      .order("collected_at", { ascending: false })
      .limit(250);
    if (error) throw new Error(`Não foi possível carregar as métricas: ${error.message}`);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      channel_id: row.channel_id,
      metric_type: row.metric_type,
      value: Number(row.value),
      collected_at: row.collected_at,
      channel_name: Array.isArray(row.social_channels) ? row.social_channels[0]?.channel_name ?? "Canal" : row.social_channels?.channel_name ?? "Canal",
      platform: Array.isArray(row.social_channels) ? row.social_channels[0]?.platform ?? "unknown" : row.social_channels?.platform ?? "unknown",
    })) as ExternalMetric[];
  });

export const getExternalChannels = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from("social_channels")
      .select("id,platform,channel_name,channel_url,icon,is_active")
      .eq("is_active", true)
      .order("channel_name");
    if (error) throw new Error(`Não foi possível carregar os canais: ${error.message}`);
    return (data ?? []) as ExternalChannel[];
  });

export const collectTelegramMetric = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .handler(async ({ context }) => {
    const db = await getDb();
    const { data: channels, error: channelError } = await db
      .from("social_channels")
      .select("id,platform,channel_name,channel_url")
      .eq("is_active", true)
      .eq("platform", "telegram")
      .order("created_at", { ascending: true })
      .limit(20);
    if (channelError) throw new Error(`Não foi possível localizar o canal Telegram: ${channelError.message}`);
    const channel = (channels ?? [])[0];
    if (!channel) throw new Error("Nenhum canal Telegram ativo está cadastrado em social_channels.");

    const token = await getIntegrationSecretServer("telegram", "bot_token");
    const configuredChannelId = await getIntegrationSecretServer("telegram", "channel_id");
    if (!token) throw new Error("Bot Token do Telegram não está configurado no Secure Hub.");
    if (!configuredChannelId?.trim()) throw new Error("Channel ID do Telegram não está configurado no Secure Hub.");

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(token)}/getChatMemberCount?chat_id=${encodeURIComponent(configuredChannelId.trim())}`,
      { method: "GET", headers: { accept: "application/json" }, signal: AbortSignal.timeout(10000) },
    );
    if (!telegramResponse.ok) throw new Error(`Telegram respondeu HTTP ${telegramResponse.status}.`);

    const result = (await telegramResponse.json()) as { ok?: boolean; result?: number; description?: string };
    if (!result.ok || typeof result.result !== "number" || !Number.isInteger(result.result) || result.result < 0) {
      throw new Error(result.description ?? "O Telegram não retornou uma quantidade de membros válida.");
    }

    const { data: metric, error: metricError } = await db
      .from("external_channel_metrics")
      .insert({ channel_id: channel.id, metric_type: "member_count", value: result.result })
      .select("id,channel_id,metric_type,value,collected_at")
      .single();
    if (metricError) throw new Error(`Não foi possível armazenar a métrica: ${metricError.message}`);

    const { error: auditError } = await db.from("admin_audit_log").insert({
      actor_user_id: context.userId ?? null,
      actor_email: context.userEmail ?? null,
      action_type: "TELEGRAM_METRIC_COLLECTED",
      entity_type: "external_channel_metric",
      entity_id: metric.id,
      previous_value: {},
      new_value: { channel_id: channel.id, metric_type: "member_count", value: result.result },
    });
    if (auditError) console.warn("Métrica coletada, mas a auditoria não foi registrada:", auditError.message);

    return {
      ...metric,
      value: Number(metric.value),
      channel_name: channel.channel_name,
      platform: channel.platform,
    } as ExternalMetric;
  });
