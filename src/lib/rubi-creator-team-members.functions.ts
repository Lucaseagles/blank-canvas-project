import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";

const uuid=z.string().uuid();
const assignmentSchema=z.object({
 teamId:uuid,commercialProfileId:uuid,
 status:z.enum(["active","paused"]),expectedStatus:z.enum(["active","paused"]).nullable()
});

/** Master-only membership directory. An assigned member is not a confirmed sale or authorized product. */
export const listRubiCreatorTeamMembersAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const [teamsResult,partnersResult,membersResult]=await Promise.all([
   db.from("rubi_creator_teams").select("id,name,niche").order("created_at",{ascending:false}).limit(100),
   db.from("commercial_profiles").select("id,display_name,partner_type,instagram_handle")
    .eq("audience","partner").eq("status","approved").order("created_at",{ascending:false}).limit(200),
   db.from("rubi_creator_team_members").select("id,team_id,commercial_profile_id,status,joined_at")
    .order("joined_at",{ascending:false}).limit(500)
  ]);
  if(teamsResult.error)throw teamsResult.error;
  if(partnersResult.error)throw partnersResult.error;
  if(membersResult.error)throw membersResult.error;
  return {
   teams:teamsResult.data??[],approvedPartners:partnersResult.data??[],
   members:membersResult.data??[],
   partial:(teamsResult.data??[]).length===100||(partnersResult.data??[]).length===200||
    (membersResult.data??[]).length===500
  };
 });

/** Assignment checks profile status at write time. No automatic grant, commission, referral or agreement. */
export const assignRubiCreatorTeamMemberAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>assignmentSchema.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_set_team_membership_audited",{
   p_actor:context.userId,p_team:data.teamId,p_profile:data.commercialProfileId,
   p_status:data.status,p_expected_status:data.expectedStatus
  });
  if(error)throw error;
  const row=rows?.[0];
  if(!row)throw new Error("Vínculo e auditoria não registrados.");
  return {id:String(row.saved_id),notice:"Vínculo de time auditado. Produtos e remuneração permanecem inalterados."};
 });
