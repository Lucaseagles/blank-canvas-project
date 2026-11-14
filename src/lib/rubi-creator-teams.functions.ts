import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
const uuid=z.string().uuid();
const teamSchema=z.object({id:uuid.optional(),revision:z.number().int().positive().optional(),name:z.string().trim().min(3).max(100),
 niche:z.string().trim().min(2).max(100),objective:z.string().trim().max(500),
 stage:z.enum(["building","testing","scaling","paused"])});
const prospectSchema=z.object({
 id:uuid.optional(),revision:z.number().int().positive().optional(),team_id:uuid,creator_name:z.string().trim().min(2).max(120),
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
   .select("id,revision,name,niche,objective,stage,created_at").order("created_at",{ascending:false}).limit(100);
  if(teamError)throw teamError;
  const {data:prospects,error:prospectError}=await db.from("rubi_creator_prospects")
   .select("id,revision,team_id,creator_name,platform,profile_url,follower_count,tier,stage,compensation_model,proposed_commission_percent,proposed_fixed_fee,notes")
   .order("created_at",{ascending:false}).limit(500);
  if(prospectError)throw prospectError;
  const teamIds=(teams??[]).map((team:{id:string})=>team.id);
  let targets:any[]=[];
  if(teamIds.length){
   const response=await db.from("rubi_creator_team_growth_targets")
    .select("team_id,revision,nano_target,micro_target,mid_target,macro_target,mega_target,expansion_evidence,approved_budget").in("team_id",teamIds);
   if(response.error)throw response.error;
   targets=response.data??[];
  }
  const prospectIds=(prospects??[]).map((p:{id:string})=>p.id);
  let fitReviews:any[]=[];
  if(prospectIds.length){
   const result=await db.from("rubi_creator_fit_reviews")
    .select("id,prospect_id,revision,niche_fit,audience_overlap,engagement_quality,content_quality,compliance_readiness,evidence_notes,fit_score,recommendation,reviewed_at")
    .in("prospect_id",prospectIds);
   if(result.error)throw result.error;
   fitReviews=result.data??[];
  }
  return {teams:teams??[],prospects:prospects??[],targets,fitReviews,partial:(teams??[]).length===100||(prospects??[]).length===500};
 });
export const saveRubiCreatorTeamAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>teamSchema.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_save_creator_team_audited",{
   p_actor:context.userId,p_id:data.id??null,p_expected_revision:data.revision??null,
   p_name:data.name,p_niche:data.niche,p_objective:data.objective,p_stage:data.stage
  });
  if(error)throw error;
  if(!rows?.length)throw new Error("Time e auditoria não registrados.");
  return {id:String(rows[0].saved_id)};
 });
export const saveRubiCreatorProspectAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>prospectSchema.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_save_creator_prospect_audited",{
   p_actor:context.userId,p_id:data.id??null,p_expected_revision:data.revision??null,
   p_team:data.team_id,p_name:data.creator_name,p_platform:data.platform,p_url:data.profile_url,
   p_followers:data.follower_count,p_tier:data.tier,p_stage:data.stage,
   p_compensation:data.compensation_model,p_percent:data.proposed_commission_percent,
   p_fee:data.proposed_fixed_fee,p_notes:data.notes
  });
  if(error)throw error;
  if(!rows?.length)throw new Error("Prospecção e auditoria não registradas.");
  return {id:String(rows[0].saved_id)};
 });
const growthTargetsSchema=z.object({
 teamId:uuid,revision:z.number().int().positive().nullable(),
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
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_save_creator_growth_targets_audited",{
   p_actor:context.userId,p_team:data.teamId,p_expected_revision:data.revision,
   p_nano:data.nanoTarget,p_micro:data.microTarget,p_mid:data.midTarget,
   p_macro:data.macroTarget,p_mega:data.megaTarget,p_evidence:data.expansionEvidence,
   p_budget:data.approvedBudget
  });
  if(error)throw error;
  if(!rows?.length)throw new Error("Metas e auditoria não registradas.");
  return {ok:true,notice:"Metas registradas com auditoria. Nenhuma parceria ou despesa foi aprovada."};
 });
