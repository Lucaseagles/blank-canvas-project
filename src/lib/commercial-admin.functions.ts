import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getCommercialProfilesAdmin = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
 const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
 const { data, error } = await (supabaseAdmin as any).from("commercial_profiles").select("id,user_id,audience,partner_type,display_name,business_name,instagram_handle,business_document,notes,status,created_at").order("created_at",{ascending:false}).limit(200);
 if(error) throw error;
 return data ?? [];
});
export const decideCommercialProfile = createServerFn({ method: "POST" }).middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({id:z.string().uuid(),status:z.enum(["approved","rejected"])}).parse(input))
 .handler(async ({data})=>{
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const {error}=await (supabaseAdmin as any).from("commercial_profiles").update({status:data.status,updated_at:new Date().toISOString()}).eq("id",data.id).eq("status","pending");
 if(error) throw error;
 return {success:true};
 });
