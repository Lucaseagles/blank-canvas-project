import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";

const uuid=z.string().uuid();
const assignmentSchema=z.object({
 teamId:uuid,commercialProfileId:uuid,
 status:z.enum(["active","paused"])
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
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const [teamResult,profileResult]=await Promise.all([
   db.from("rubi_creator_teams").select("id").eq("id",data.teamId).maybeSingle(),
   db.from("commercial_profiles").select("id,audience,status")
    .eq("id",data.commercialProfileId).maybeSingle()
  ]);
  if(teamResult.error)throw teamResult.error;
  if(profileResult.error)throw profileResult.error;
  if(!teamResult.data)throw new Error("Time não encontrado.");
  const profile=profileResult.data;
  if(!profile||profile.audience!=="partner"||profile.status!=="approved")
   throw new Error("Somente parceiros comerciais aprovados podem integrar um time.");
  const {data:row,error}=await db.from("rubi_creator_team_members").upsert({
   team_id:data.teamId,commercial_profile_id:data.commercialProfileId,status:data.status,
   updated_at:new Date().toISOString()
  },{onConflict:"team_id,commercial_profile_id"}).select("id").single();
  if(error)throw error;
  return {id:String(row.id),notice:"Vínculo de time salvo. Produtos e remuneração permanecem inalterados."};
 });
