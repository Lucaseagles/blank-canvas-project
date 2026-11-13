import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";

const uuid=z.string().uuid();
export const listRubiAuthorizedMastersAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async({context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:primary,error:primaryError}=await db.rpc("rubi_primary_master_id");
  if(primaryError)throw primaryError;
  const {data:roles,error}=await db.from("user_roles").select("user_id")
   .eq("role","owner").order("user_id").limit(101);
  if(error)throw error;
  const masterIds=(roles??[]).map((r:{user_id:string})=>r.user_id);
  return {isFoundingMaster:context.userId===primary,masters:masterIds.slice(0,100).map((id:string)=>({
   userId:id,isFoundingMaster:id===primary
  })),partial:masterIds.length>100,
   note:"Somente o Master fundador pode conceder ou revogar acessos; os outros Masters têm acesso administrativo, mas não podem conceder privilégios."};
 });
export const changeRubiAuthorizedMasterAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({userId:uuid,grant:z.boolean()}).parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {error}=await (supabaseAdmin as any).rpc("rubi_manage_master_access",{
   p_actor:context.userId,p_target:data.userId,p_grant:data.grant
  });
  if(error)throw error;
  return {success:true,roleChanged:true};
 });
