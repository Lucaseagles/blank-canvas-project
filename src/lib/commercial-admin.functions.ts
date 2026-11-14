import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getCommercialProfilesAdmin = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
 const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
 const { data, error } = await (supabaseAdmin as any).from("commercial_profiles").select("id,user_id,audience,partner_type,display_name,business_name,instagram_handle,business_document,notes,status,created_at").order("created_at",{ascending:false}).limit(200);
 if(error) throw error;
 return data ?? [];
});
/** Legacy admin route uses same audited decision as the canonical approval panel. */
export const decideCommercialProfile = createServerFn({ method: "POST" }).middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({id:z.string().uuid(),status:z.enum(["approved","rejected"])}).parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_decide_commercial_profile_audited",{
   p_actor:context.userId,p_profile_id:data.id,p_decision:data.status
  });
  if(error)throw error;
  if(!rows?.length)throw new Error("Decisão não registrada.");
  return {success:true};
 });
