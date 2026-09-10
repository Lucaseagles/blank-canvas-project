import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

/** Single registry over the existing configuration sources; no duplicate truth is introduced. */
const SETTINGS_REGISTRY = [
  { key: "personalization_weights", label: "Pesos de Personalização", category: "Personalização", table: "personalization_weights", editable: ["weight"] },
  { key: "feed_mix_config", label: "Mix do Feed", category: "Personalização", table: "feed_mix_config", editable: ["relevant_pct", "related_pct", "discovery_pct"] },
  { key: "social_proof_config", label: "Prova Social", category: "Prova Social", table: "social_proof_config", editable: ["is_enabled", "hybrid_simulation_enabled", "show_location", "simulated_volume_boost", "show_aggregated_counters", "min_events_for_counter", "counter_window_hours", "allowed_event_types", "enabled_formats", "content_affinity_threshold", "low_volume_threshold", "adaptive_priority_enabled"] },
  { key: "popup_rules", label: "Regras de Pop-up", category: "Marketing Estratégico", table: "popup_rules", editable: ["priority", "cooldown_minutes", "frequency_cap_per_day", "starts_at", "ends_at", "content", "cta_label", "cta_target", "is_active"] },
  { key: "ab_experiments", label: "Experimentos A/B", category: "Marketing Estratégico", table: "ab_experiments", editable: ["variant_a", "variant_b", "target", "is_active"] },
  { key: "automation_rules", label: "Regras de Automação", category: "Automação", table: "automation_rules", editable: ["trigger_condition", "action_params", "is_active", "is_fully_automated"] },
  { key: "app_points_config", label: "Pontos por Ação", category: "Gamificação", table: "app_points_config", editable: ["points", "description"] },
  { key: "badges", label: "Badges", category: "Gamificação", table: "badges", editable: ["name", "description", "icon", "criteria"] },
  { key: "missions", label: "Missões", category: "Gamificação", table: "missions", editable: ["title", "description", "criteria", "reward_points", "is_active"] },
  { key: "compliance_rules", label: "Regras de Compliance", category: "Compliance", table: "compliance_rules", editable: ["rule_value", "is_enforced", "notes", "source_url", "reviewed_at"] },
  { key: "feature_flags", label: "Feature Flags", category: "Feature Flags", table: "feature_flags", editable: ["is_enabled"] },
  { key: "marketplaces", label: "Marketplaces", category: "Integrações", table: "marketplaces", editable: ["status", "api_status"] },
  { key: "whatsapp_config", label: "WhatsApp", category: "Integrações", table: "whatsapp_config", editable: ["business_account_id", "phone_number_id", "is_active", "public_phone_number"] },
  { key: "telegram_config", label: "Telegram", category: "Integrações", table: "telegram_config", editable: ["channel_id", "is_active"] },
] as const;

const SECRET_KEYS = new Set(["token", "access_token", "refresh_token", "api_key", "apikey", "secret", "password", "client_secret", "authorization", "bot_token", "service_role_key", "bot_token_secret_ref", "access_token_secret_ref", "api_config"]);
const HAS_UPDATED_AT = new Set(["personalization_weights", "feed_mix_config", "social_proof_config", "automation_rules", "app_points_config", "feature_flags", "whatsapp_config", "telegram_config"]);

type SerializableValue = string | number | boolean | null | SerializableValue[] | { [key: string]: SerializableValue };

function sanitize(value: unknown): SerializableValue {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(sanitize);
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value !== "object") return String(value);
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, SECRET_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : sanitize(nested)]));
}

function registryEntry(key: string) {
  const entry = SETTINGS_REGISTRY.find((item) => item.key === key);
  if (!entry) throw new Error("Unknown configuration source");
  return entry;
}

export const getAdminSettings = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  return Promise.all(SETTINGS_REGISTRY.map(async (entry) => {
    const { data, error } = await db.from(entry.table).select("*").limit(100);
    if (error) return { ...entry, rows: [] as SerializableValue[], available: false, error: String(error.message) };
    const rows = [...(data ?? [])].sort((a: any, b: any) => String(b["updated_at"] ?? b["created_at"] ?? "").localeCompare(String(a["updated_at"] ?? a["created_at"] ?? ""))).map(sanitize);
    return { ...entry, rows, available: true, error: null };
  }));
});

export const updateAdminSetting = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).inputValidator((data: unknown) => z.object({ source: z.string().trim().min(1).max(100), id: z.string().uuid(), patch: z.record(z.string(), z.unknown()) }).parse(data)).handler(async ({ data, context }) => {
  const entry = registryEntry(data.source);
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data.patch)) {
    if (!entry.editable.includes(key as never)) continue;
    if (SECRET_KEYS.has(key.toLowerCase())) throw new Error("Secrets cannot be edited through the generic settings editor");
    patch[key] = value;
  }
  if (Object.keys(patch).length === 0) throw new Error("No editable fields supplied");
  if (HAS_UPDATED_AT.has(entry.key)) patch["updated_at"] = new Date().toISOString();

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const { data: before, error: readError } = await db.from(entry.table).select("*").eq("id", data.id).single();
  if (readError) throw readError;
  const { data: after, error } = await db.from(entry.table).update(patch).eq("id", data.id).select("*").single();
  if (error) throw error;

  // Use the verified user-bound client for the audit RPC so auth.uid() is the owner who made the mutation.
  const authDb = context.supabase as any;
  const { error: auditError } = await authDb.rpc("append_admin_audit", {
    p_action_type: "UPDATE",
    p_entity_type: entry.table,
    p_entity_id: data.id,
    p_previous_value: sanitize(before),
    p_new_value: sanitize(after),
  });
  if (auditError) throw auditError;

  return { success: true, row: sanitize(after) };
});

export const getAdminAuditLog = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).inputValidator((data: unknown) => z.object({ page: z.number().int().min(0).default(0), pageSize: z.number().int().min(1).max(100).default(25), actionType: z.string().trim().max(80).optional(), entityType: z.string().trim().max(120).optional() }).parse(data)).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  let query = db.from("admin_audit_log").select("id,actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value,created_at", { count: "exact" }).order("created_at", { ascending: false }).range(data.page * data.pageSize, (data.page + 1) * data.pageSize - 1);
  if (data.actionType) query = query.eq("action_type", data.actionType);
  if (data.entityType) query = query.eq("entity_type", data.entityType);
  const { data: rows, error, count } = await query;
  if (error) throw error;
  return { rows: (rows ?? []).map(sanitize), count: count ?? 0, page: data.page, pageSize: data.pageSize };
});

export { SETTINGS_REGISTRY };
