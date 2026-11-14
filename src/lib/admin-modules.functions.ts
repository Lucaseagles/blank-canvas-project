import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export type HomeModule = { id: string; module_key: string; module_name: string; is_enabled: boolean; display_order: number; config: Record<string, JsonValue>; updated_at: string };
export type BadgeConfig = { id: string; badge_key: string; badge_name: string; badge_text: string; icon: string | null; color: string | null; threshold: Record<string, JsonValue> | null; is_enabled: boolean; updated_at: string };
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
const idSchema = z.string().uuid();
const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;

export const getAdminHomeModules = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const client = await db(); const { data, error } = await client.from("home_modules_config").select("id,module_key,module_name,is_enabled,display_order,config,updated_at").order("display_order", { ascending: true }).order("id", { ascending: true });
  if (error) throw new Error(error.message); return (data ?? []) as HomeModule[];
});

export const setHomeModuleEnabled = createServerFn({ method: "POST" })
 .middleware([requireOwnerRole])
 .validator((v:unknown)=>z.object({id:idSchema,expected:z.boolean(),enabled:z.boolean()}).parse(v))
 .handler(async({data,context})=>{
  const client=await db();
  const {data:rows,error}=await client.rpc("rubi_set_home_module_enabled_audited",{
   p_actor:context.userId,p_id:data.id,p_expected:data.expected,p_enabled:data.enabled
  });
  if(error)throw new Error(error.message);
  if(!rows?.[0]?.saved_id)throw new Error("Alteração e auditoria não registradas.");
  const {data:updated,error:readError}=await client.from("home_modules_config")
   .select("id,module_key,module_name,is_enabled,display_order,config,updated_at").eq("id",data.id).single();
  if(readError)throw new Error(readError.message);
  return updated as HomeModule;
 });

export const reorderHomeModules = createServerFn({ method: "POST" })
 .middleware([requireOwnerRole])
 .validator((v:unknown)=>z.object({ids:z.array(idSchema).min(1).max(100),expectedIds:z.array(idSchema).min(1).max(100)}).parse(v))
 .handler(async({data,context})=>{
  const client=await db();
  const {data:rows,error}=await client.rpc("rubi_reorder_home_modules_audited",{
   p_actor:context.userId,p_ids:data.ids,p_expected_ids:data.expectedIds
  });
  if(error)throw new Error(error.message);
  if(rows?.[0]?.saved_count!==data.ids.length)throw new Error("Ordenação e auditoria não confirmadas.");
  const {data:updated,error:readError}=await client.from("home_modules_config")
   .select("id,module_key,module_name,is_enabled,display_order,config,updated_at")
   .order("display_order",{ascending:true}).order("id",{ascending:true});
  if(readError)throw new Error(readError.message);
  return (updated??[]) as HomeModule[];
 });

export const getAdminBadges = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const client = await db(); const { data, error } = await client.from("badges_config").select("id,badge_key,badge_name,badge_text,icon,color,threshold,is_enabled,updated_at").order("badge_name", { ascending: true });
  if (error) throw new Error(error.message); return (data ?? []) as BadgeConfig[];
});

export const setBadgeEnabled = createServerFn({ method: "POST" })
 .middleware([requireOwnerRole])
 .validator((v:unknown)=>z.object({id:idSchema,expected:z.boolean(),enabled:z.boolean()}).parse(v))
 .handler(async({data,context})=>{
  const client=await db();
  const {data:rows,error}=await client.rpc("rubi_set_badge_enabled_audited",{
   p_actor:context.userId,p_id:data.id,p_expected:data.expected,p_enabled:data.enabled
  });
  if(error)throw new Error(error.message);
  if(!rows?.[0]?.saved_id)throw new Error("Badge e auditoria não registrados.");
  const {data:updated,error:readError}=await client.from("badges_config")
   .select("id,badge_key,badge_name,badge_text,icon,color,threshold,is_enabled,updated_at")
   .eq("id",data.id).single();
  if(readError)throw new Error(readError.message);
  return updated as BadgeConfig;
 });

export const getPublicHomeModules = createServerFn({ method: "GET" }).handler(async () => {
  // Keep the full configuration: an empty enabled set is different from no configuration.
  const client = await db(); const { data, error } = await client.from("home_modules_config").select("id,module_key,module_name,is_enabled,display_order,config,updated_at").order("display_order", { ascending: true });
  if (error) throw new Error(error.message); return (data ?? []) as HomeModule[];
});

export const getPublicBadgeConfig = createServerFn({ method: "GET" }).handler(async () => {
  const client = await db(); const { data, error } = await client.from("badges_config").select("id,badge_key,badge_name,badge_text,icon,color,threshold,is_enabled,updated_at").eq("is_enabled", true).order("badge_name", { ascending: true });
  if (error) throw new Error(error.message); return (data ?? []) as BadgeConfig[];
});
