import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export type ExternalMetric = {
  id: string; channel_id: string | null; metric_type: string; value: number;
  collected_at: string; channel_name?: string; platform?: string;
};
export type ExternalChannel = {
  id: string; platform: string; channel_name: string; channel_url: string;
  icon: string | null; is_active: boolean;
};
const getDb = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;
const marketplaceInput = z.object({ marketplaceId: z.string().uuid() });

export const updateMarketplaceCredentials = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => z.object({ marketplaceId: z.string().uuid(), credentials: z.record(z.unknown()) }).parse(data))
  .handler(async ({ data, context }) => {
    const db = await getDb();
    const { error } = await db.rpc("rubi_manage_marketplace_audited", {
      p_action: "credentials", p_id: data.marketplaceId, p_payload: data.credentials, p_actor: context.userId,
    });
    if (error) throw new Error(`Não foi possível salvar as credenciais: ${error.message}`);
    return { success: true };
  });

export const syncMarketplace = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => marketplaceInput.parse(data))
  .handler(async ({ data, context }) => {
    const db = await getDb();
    const { data: marketplace, error } = await db.from("marketplaces")
      .select("id,name,slug,api_config").eq("id", data.marketplaceId).single();
    if (error) throw new Error(`Não foi possível carregar o marketplace: ${error.message}`);
    const apiStatus = !marketplace?.api_config ? "not_configured" : "connector_not_implemented";
    const { error: statusError } = await db.rpc("rubi_manage_marketplace_audited", {
      p_action: "api_status", p_id: data.marketplaceId, p_payload: { api_status: apiStatus }, p_actor: context.userId,
    });
    if (statusError) throw new Error(`Não foi possível registrar o status da integração: ${statusError.message}`);
    return {
      success: false, syncedCount: 0,
      message: !marketplace?.api_config
        ? `${marketplace.name}: API não configurada. O cadastro manual de produtos continua disponível.`
        : `${marketplace.name}: credenciais encontradas, mas o conector específico ainda não está implementado. Nenhum produto foi alterado.`,
    };
  });

export const getExternalMetrics = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const db = await getDb();
    const { data, error } = await db.from("external_channel_metrics")
      .select("id,channel_id,metric_type,value,collected_at,social_channels:channel_id(channel_name,platform)")
      .order("collected_at", { ascending: false }).limit(250);
    if (error) throw new Error(`Não foi possível carregar as métricas: ${error.message}`);
    return (data ?? []).map((row: any) => ({
      id: row.id, channel_id: row.channel_id, metric_type: row.metric_type, value: Number(row.value),
      collected_at: row.collected_at,
      channel_name: Array.isArray(row.social_channels) ? row.social_channels[0]?.channel_name ?? "Canal" : row.social_channels?.channel_name ?? "Canal",
      platform: Array.isArray(row.social_channels) ? row.social_channels[0]?.platform ?? "unknown" : row.social_channels?.platform ?? "unknown",
    })) as ExternalMetric[];
  });

export const getExternalChannels = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const db = await getDb();
    const { data, error } = await db.from("social_channels")
      .select("id,platform,channel_name,channel_url,icon,is_active")
      .eq("is_active", true).order("channel_name");
    if (error) throw new Error(`Não foi possível carregar os canais: ${error.message}`);
    return (data ?? []) as ExternalChannel[];
  });
