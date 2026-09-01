import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const SETTINGS_REGISTRY = [
  { key: "personalization_weights", label: "Pesos de Personalização", category: "Personalização", table: "personalization_weights", editable: ["weight"] },
  { key: "feed_mix_config", label: "Mix do Feed", category: "Personalização", table: "feed_mix_config", editable: ["weight", "value", "enabled", "is_active"] },
  { key: "social_proof_config", label: "Prova Social", category: "Prova Social", table: "social_proof_config", editable: ["enabled", "is_active", "threshold", "min_events", "recency_window_hours", "value"] },
  { key: "popup_rules", label: "Regras de Pop-up", category: "Marketing Estratégico", table: "popup_rules", editable: ["enabled", "is_active", "priority", "trigger_condition", "frequency_cap"] },
  { key: "ab_experiments", label: "Experimentos A/B", category: "Marketing Estratégico", table: "ab_experiments", editable: ["is_active", "target", "variant_a", "variant_b"] },
  { key: "automation_rules", label: "Regras de Automação", category: "Automação", table: "automation_rules", editable: ["is_active", "is_fully_automated", "trigger_condition", "action_params"] },
  { key: "app_points_config", label: "Pontos por Ação", category: "Gamificação", table: "app_points_config", editable: ["points", "description"] },
  { key: "compliance_rules", label: "Regras de Compliance", category: "Compliance", table: "compliance_rules", editable: ["enabled", "is_active", "threshold", "rules", "config"] },
  { key: "feature_flags", label: "Feature Flags", category: "Feature Flags", table: "feature_flags", editable: ["enabled", "is_enabled", "value"] },
  { key: "coupon_capability", label: "Coupon Capability", category: "Integrações", table: "coupon_capability", editable: ["enabled", "is_enabled", "value"] },
  { key: "whatsapp_config", label: "WhatsApp", category: "Integrações", table: "whatsapp_config", editable: ["enabled", "is_enabled", "phone_number", "value"] },
  { key: "telegram_config", label: "Telegram", category: "Integrações", table: "telegram_config", editable: ["enabled", "is_enabled", "username", "value"] },
] as const;

const SECRET_KEYS = new Set(["token", "access_token", "refresh_token", "api_key", "apikey", "secret", "password", "client_secret", "authorization", "bot_token", "service_role_key"]);
const HAS_UPDATED_AT = new Set(["personalization_weights", "feed_mix_config", "social_proof_config", "popup_rules", "automation_rules", "app_points_config", "compliance_rules", "feature_flags", "coupon_capability", "whatsapp_config", "telegram_config"]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, SECRET_KEYS.has(k.toLowerCase()) ? "[REDACTED]" : sanitize(v)]));
}

function registryEntry(key: string) { const entry = SETTINGS_REGISTRY.find((item) => item.key === key); if (!entry) throw new Error("Unknown configuration source"); return entry; }

export const getAdminSettings = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server"); const db = supabaseAdmin as any;
  return Promise.all(SETTINGS_REGISTRY.map(async (entry) => {
    const { data, error } = await db.from(entry.table).select("*").limit(100);
    if (error) return { ...entry, rows: [], available: false, error: error.message };
    const rows = [...(data ?? [])].sort((a: any, b: any) => String(b.updated_at ?? b.created_at ?? "").localeCompare(String(a.updated_at ?? a.created_at ?? ""))).map(sanitize);
    return { ...entry, rows, available: true, error: null };
  }));
});

export const updateAdminSetting = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ source: z.string().min(1), id: z.string().min(1), patch: z.record(z.string(), z.unknown()) }).parse(data)).handler(async ({ data }) => {
  const entry = registryEntry(data.source); const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data.patch)) { if (!entry.editable.includes(key as never)) continue; if (SECRET_KEYS.has(key.toLowerCase())) throw new Error("Secrets cannot be edited through the generic settings editor"); patch[key] = value; }
  if (Object.keys(patch).length === 0) throw new Error("No editable fields supplied");
  if (HAS_UPDATED_AT.has(entry.key)) patch.updated_at = new Date().toISOString();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server"); const db = supabaseAdmin as any;
  const { data: before, error: readError } = await db.from(entry.table).select("*").eq("id", data.id).single(); if (readError) throw readError;
  const { data: after, error } = await db.from(entry.table).update(patch).eq("id", data.id).select("*").single(); if (error) throw error;
  const { error: auditError } = await db.rpc("append_admin_audit", { p_action_type: "UPDATE", p_entity_type: entry.table, p_entity_id: data.id, p_previous_value: sanitize(before), p_new_value: sanitize(after) });
  if (auditError) throw auditError;
  return { success: true, row: sanitize(after) };
});

export const getAdminAuditLog = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ page: z.number().int().min(0).default(0), pageSize: z.number().int().min(1).max(100).default(25), actionType: z.string().optional(), entityType: z.string().optional() }).parse(data)).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server"); const db = supabaseAdmin as any;
  let query = db.from("admin_audit_log").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(data.page * data.pageSize, (data.page + 1) * data.pageSize - 1);
  if (data.actionType) query = query.eq("action_type", data.actionType); if (data.entityType) query = query.eq("entity_type", data.entityType);
  const { data: rows, error, count } = await query; if (error) throw error;
  return { rows: (rows ?? []).map(sanitize), count: count ?? 0, page: data.page, pageSize: data.pageSize };
});

export { SETTINGS_REGISTRY };
