import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
const uuid=z.string().uuid();
const teamSchema=z.object({id:uuid.optional(),name:z.string().trim().min(3).max(100),
 niche:z.string().trim().min(2).max(100),objective:z.string().trim().max(500),
 stage:z.enum(["building","testing","scaling","paused"])});
const prospectSchema=z.object({
 id:uuid.optional(),team_id:uuid,creator_name:z.string().trim().min(2).max(120),
 platform:z.enum(["instagram","tiktok","youtube","other"]),
 profile_url:z.string().trim().url().max(500).refine(s=>{
  try{const url=new URL(s);return url.protocol==="https:"&&!url.username&&!url.password;}catch{return false;}
 },"Use URL HTTPS pública válida."),
 follower_count:z.number().int().min(0).max(500000000),
 tier:z.enum(["nano","micro","mid","macro","mega"]),
 stage:z.enum(["identified","contacted","negotiating","approved","declined"]),
 compensation_model:z.enum(["commission","fixed_sponsorship","hybrid"]),
 proposed_commission_percent:z.number().min(0).max(100).nullable(),
 proposed_fixed_fee:z.number().min(0).max(10000000).nullable(),
 notes:z.string().trim().max(1000)
});
export const listRubiCreatorTeamsAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:teams,error:teamError}=await db.from("rubi_creator_teams")
   .select("id,name,niche,objective,stage,created_at").order("created_at",{ascending:false}).limit(100);
  if(teamError)throw teamError;
  const {data:prospects,error:prospectError}=await db.from("rubi_creator_prospects")
   .select("id,team_id,creator_name,platform,profile_url,follower_count,tier,stage,compensation_model,proposed_commission_percent,proposed_fixed_fee,notes")
   .order("created_at",{ascending:false}).limit(500);
  if(prospectError)throw prospectError;
  const teamIds=(teams??[]).map((team:{id:string})=>team.id);
  let targets:any[]=[];
  if(teamIds.length){
   const response=await db.from("rubi_creator_team_growth_targets")
    .select("team_id,nano_target,micro_target,mid_target,macro_target,mega_target,expansion_evidence,approved_budget").in("team_id",teamIds);
   if(response.error)throw response.error;
   targets=response.data??[];
  }
  return {teams:teams??[],prospects:prospects??[],targets,partial:(teams??[]).length===100||(prospects??[]).length===500};
 });
export const saveRubiCreatorTeamAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>teamSchema.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  if(data.id){
   const {data:row,error}=await db.from("rubi_creator_teams").update({
    name:data.name,niche:data.niche,objective:data.objective,stage:data.stage,updated_at:new Date().toISOString()
   }).eq("id",data.id).select("id").maybeSingle();
   if(error)throw error;if(!row)throw new Error("Time não encontrado.");
   return {id:String(row.id)};
  }
  const {data:row,error}=await db.from("rubi_creator_teams")
   .insert({name:data.name,niche:data.niche,objective:data.objective,stage:data.stage})
   .select("id").single();
  if(error)throw error;
  return {id:String(row.id)};
 });
export const saveRubiCreatorProspectAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>prospectSchema.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:team,error:teamError}=await db.from("rubi_creator_teams")
   .select("id").eq("id",data.team_id).maybeSingle();
  if(teamError)throw teamError;
  if(!team)throw new Error("Time não encontrado.");
  const {id,...values}=data;
  if(id){
   const {data:row,error}=await db.from("rubi_creator_prospects")
    .update({...values,updated_at:new Date().toISOString()})
    .eq("id",id).eq("team_id",data.team_id).select("id").maybeSingle();
   if(error)throw error;if(!row)throw new Error("Criador não encontrado neste time.");
   return {id:String(row.id)};
  }
  const {data:row,error}=await db.from("rubi_creator_prospects")
   .insert(values).select("id").single();
  if(error)throw error;
  return {id:String(row.id)};
 });

const growthTargetsSchema=z.object({
 teamId:uuid,
 nanoTarget:z.number().int().min(0).max(100000),
 microTarget:z.number().int().min(0).max(100000),
 midTarget:z.number().int().min(0).max(100000),
 macroTarget:z.number().int().min(0).max(100000),
 megaTarget:z.number().int().min(0).max(100000),
 expansionEvidence:z.string().trim().max(1500),
 approvedBudget:z.number().finite().min(0).max(100000000).nullable()
});
/** Targets do not activate a creator, approve expense or imply successful sales. */
export const saveRubiCreatorTeamGrowthTargetsAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>growthTargetsSchema.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:team,error:teamError}=await db.from("rubi_creator_teams")
   .select("id").eq("id",data.teamId).maybeSingle();
  if(teamError)throw teamError;
  if(!team)throw new Error("Time não localizado.");
  const {error}=await db.from("rubi_creator_team_growth_targets").upsert({
   team_id:data.teamId,nano_target:data.nanoTarget,micro_target:data.microTarget,
   mid_target:data.midTarget,macro_target:data.macroTarget,mega_target:data.megaTarget,
   expansion_evidence:data.expansionEvidence,approved_budget:data.approvedBudget,
   updated_at:new Date().toISOString()
  },{onConflict:"team_id"});
  if(error)throw error;
  return {ok:true,notice:"Meta de crescimento registrada. Nenhuma parceria ou despesa foi aprovada."};
 });
