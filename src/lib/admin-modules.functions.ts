import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export type HomeModule = { id: string; module_key: string; module_name: string; is_enabled: boolean; display_order: number; config: Record<string, unknown>; updated_at: string };
export type BadgeConfig = { id: string; badge_key: string; badge_name: string; badge_text: string; icon: string | null; color: string | null; threshold: Record<string, unknown> | null; is_enabled: boolean; updated_at: string };
const idSchema = z.string().uuid();
const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;

export const getAdminHomeModules = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const client = await db(); const { data, error } = await client.from("home_modules_config").select("id,module_key,module_name,is_enabled,display_order,config,updated_at").order("display_order", { ascending: true });
  if (error) throw new Error(error.message); return (data ?? []) as HomeModule[];
});

export const setHomeModuleEnabled = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((v: unknown) => z.object({ id: idSchema, enabled: z.boolean() }).parse(v)).handler(async ({ data }) => {
  const client = await db(); const { data: old, error: readError } = await client.from("home_modules_config").select("is_enabled").eq("id", data.id).maybeSingle();
  if (readError || !old) throw new Error(readError?.message ?? "Módulo não encontrado.");
  const { data: updated, error } = await client.from("home_modules_config").update({ is_enabled: data.enabled, updated_at: new Date().toISOString() }).eq("id", data.id).select("id,module_key,module_name,is_enabled,display_order,config,updated_at").single();
  if (error) throw new Error(error.message);
  await client.from("admin_audit_log").insert({ actor_user_id: null, actor_email: "eaglesfr49@gmail.com", action_type: data.enabled ? "HOME_MODULE_ENABLED" : "HOME_MODULE_DISABLED", entity_type: "home_module", entity_id: data.id, previous_value: old, new_value: { is_enabled: data.enabled } });
  return updated as HomeModule;
});

export const reorderHomeModules = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((v: unknown) => z.object({ ids: z.array(idSchema).min(1).max(100) }).parse(v)).handler(async ({ data }) => {
  const client = await db(); const { data: rows, error } = await client.from("home_modules_config").select("id").order("display_order", { ascending: true });
  if (error) throw new Error(error.message); const oldIds = (rows ?? []).map((r: { id: string }) => r.id);
  if (oldIds.length !== data.ids.length || oldIds.some((id: string) => !data.ids.includes(id))) throw new Error("Lista de módulos inválida.");
  for (let i = 0; i < data.ids.length; i++) { const r = await client.from("home_modules_config").update({ display_order: i + 1, updated_at: new Date().toISOString() }).eq("id", data.ids[i]); if (r.error) throw new Error(r.error.message); }
  await client.from("admin_audit_log").insert({ actor_user_id: null, actor_email: "eaglesfr49@gmail.com", action_type: "HOME_MODULES_REORDERED", entity_type: "home_module", entity_id: data.ids[0], previous_value: { ids: oldIds }, new_value: { ids: data.ids } });
  return { ids: data.ids };
});

export const getAdminBadges = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const client = await db(); const { data, error } = await client.from("badges_config").select("id,badge_key,badge_name,badge_text,icon,color,threshold,is_enabled,updated_at").order("badge_name", { ascending: true });
  if (error) throw new Error(error.message); return (data ?? []) as BadgeConfig[];
});

export const setBadgeEnabled = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((v: unknown) => z.object({ id: idSchema, enabled: z.boolean() }).parse(v)).handler(async ({ data }) => {
  const client = await db(); const { data: old, error: readError } = await client.from("badges_config").select("is_enabled").eq("id", data.id).maybeSingle();
  if (readError || !old) throw new Error(readError?.message ?? "Badge não encontrado.");
  const { data: updated, error } = await client.from("badges_config").update({ is_enabled: data.enabled, updated_at: new Date().toISOString() }).eq("id", data.id).select("id,badge_key,badge_name,badge_text,icon,color,threshold,is_enabled,updated_at").single();
  if (error) throw new Error(error.message);
  await client.from("admin_audit_log").insert({ actor_user_id: null, actor_email: "eaglesfr49@gmail.com", action_type: data.enabled ? "BADGE_ENABLED" : "BADGE_DISABLED", entity_type: "badge_config", entity_id: data.id, previous_value: old, new_value: { is_enabled: data.enabled } });
  return updated as BadgeConfig;
});

export const getPublicHomeModules = createServerFn({ method: "GET" }).handler(async () => {
  const client = await db(); const { data, error } = await client.from("home_modules_config").select("id,module_key,module_name,is_enabled,display_order,config,updated_at").eq("is_enabled", true).order("display_order", { ascending: true });
  if (error) throw new Error(error.message); return (data ?? []) as HomeModule[];
});

export const getPublicBadgeConfig = createServerFn({ method: "GET" }).handler(async () => {
  const client = await db(); const { data, error } = await client.from("badges_config").select("id,badge_key,badge_name,badge_text,icon,color,threshold,is_enabled,updated_at").eq("is_enabled", true).order("badge_name", { ascending: true });
  if (error) throw new Error(error.message); return (data ?? []) as BadgeConfig[];
});
