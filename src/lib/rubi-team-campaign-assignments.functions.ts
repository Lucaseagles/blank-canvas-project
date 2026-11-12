import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
const uuid=z.string().uuid();
const newAssignment=z.object({
 teamId:uuid,campaignPlanId:uuid,movementId:uuid,variantId:uuid,
 notes:z.string().trim().max(1000)
});
const changeStatus=z.object({id:uuid,status:z.enum(["ready","paused"])});

/** Plans and candidate lists are visible only to the Shadow Master. */
export const listRubiTeamCampaignAssignmentsAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const [teams,plans,movements,variants,assignments]=await Promise.all([
   db.from("rubi_creator_teams").select("id,name,niche,stage").order("created_at",{ascending:false}).limit(100),
   db.from("rubi_master_campaign_plans").select("id,product_id,campaign_code,mode,audience,status").eq("mode","creator_team").order("created_at",{ascending:false}).limit(100),
   db.from("rubi_movements").select("id,product_id,name,status").order("updated_at",{ascending:false}).limit(200),
   db.from("rubi_movement_variants").select("id,movement_id,name,status,media_rights_confirmed").order("updated_at",{ascending:false}).limit(300),
   db.from("rubi_creator_team_campaign_assignments")
    .select("id,team_id,campaign_plan_id,movement_id,variant_id,status,editorial_notes,created_at")
    .order("created_at",{ascending:false}).limit(200)
  ]);
  for(const r of [teams,plans,movements,variants,assignments])if(r.error)throw r.error;
  return {teams:teams.data??[],plans:plans.data??[],movements:movements.data??[],
   variants:variants.data??[],assignments:assignments.data??[],
   partial:(teams.data??[]).length===100||(plans.data??[]).length===100||
    (movements.data??[]).length===200||(variants.data??[]).length===300||
    (assignments.data??[]).length===200};
 });

async function verifyAssignment(db:any,input:{teamId:string;campaignPlanId:string;movementId:string;variantId:string}){
 const [teamResult,planResult,movementResult,variantResult]=await Promise.all([
  db.from("rubi_creator_teams").select("id,stage").eq("id",input.teamId).maybeSingle(),
  db.from("rubi_master_campaign_plans").select("id,product_id,mode,status").eq("id",input.campaignPlanId).maybeSingle(),
  db.from("rubi_movements").select("id,product_id,status").eq("id",input.movementId).maybeSingle(),
  db.from("rubi_movement_variants").select("id,movement_id,status,media_rights_confirmed").eq("id",input.variantId).maybeSingle()
 ]);
 for(const result of [teamResult,planResult,movementResult,variantResult])if(result.error)throw result.error;
 const team=teamResult.data,plan=planResult.data,movement=movementResult.data,variant=variantResult.data;
 if(!team||!plan||!movement||!variant)throw new Error("Time, plano, movimento ou variante não encontrado.");
 if(plan.mode!=="creator_team")throw new Error("Somente campanhas do tipo time de criadores podem ser associadas.");
 if(plan.product_id!==movement.product_id||variant.movement_id!==movement.id)
  throw new Error("O movimento e a variante precisam pertencer ao mesmo produto do plano.");
 return {team,plan,movement,variant};
}
/** Draft assignments do not mean publication. Only a reviewed campaign+movement+variant can become ready. */
export const createRubiTeamCampaignAssignmentAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>newAssignment.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  await verifyAssignment(db,data);
  const {data:result,error}=await db.from("rubi_creator_team_campaign_assignments").insert({
   team_id:data.teamId,campaign_plan_id:data.campaignPlanId,movement_id:data.movementId,
   variant_id:data.variantId,editorial_notes:data.notes,status:"planned"
  }).select("id").single();
  if(error)throw error;
  return {id:String(result.id),notice:"Associação planejada. Ainda não há anúncio ou divulgação ativa."};
 });
export const changeRubiTeamCampaignAssignmentStatusAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>changeStatus.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:existing,error:readError}=await db.from("rubi_creator_team_campaign_assignments")
   .select("id,team_id,campaign_plan_id,movement_id,variant_id,status").eq("id",data.id).maybeSingle();
  if(readError)throw readError;
  if(!existing)throw new Error("Associação não localizada.");
  if(existing.status===data.status)throw new Error("Esta associação já está neste estado.");
  if(data.status==="ready"){
   const checked=await verifyAssignment(db,{
    teamId:existing.team_id,campaignPlanId:existing.campaign_plan_id,
    movementId:existing.movement_id,variantId:existing.variant_id
   });
   if(checked.team.stage==="paused"||checked.plan.status!=="approved"||
      checked.movement.status!=="review"||checked.variant.status!=="review"||
      checked.variant.media_rights_confirmed!==true)
    throw new Error("Revise o time, aprove o plano e valide movimento, criativo e direitos de mídia antes de marcar como pronto.");
  }
  const {data:updated,error}=await db.from("rubi_creator_team_campaign_assignments")
   .update({status:data.status,updated_at:new Date().toISOString()})
   .eq("id",data.id).eq("status",existing.status).select("id").maybeSingle();
  if(error)throw error;
  if(!updated)throw new Error("Associação alterada em outra sessão. Atualize antes de tentar novamente.");
  return {id:String(updated.id),notice:"Estado atualizado. Pronto não significa publicação, venda ou verba gasta."};
 });
