import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
const uuid=z.string().uuid();
const newAssignment=z.object({
 teamId:uuid,campaignPlanId:uuid,movementId:uuid,variantId:uuid,
 notes:z.string().trim().max(1000)
});
const changeStatus=z.object({id:uuid,status:z.enum(["ready","paused"]),expectedStatus:z.enum(["planned","ready","paused"])});

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

/** All planning decisions are committed with a named Owner audit in a single transaction. */
export const createRubiTeamCampaignAssignmentAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>newAssignment.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_create_team_campaign_assignment_audited",{
   p_actor:context.userId,p_team:data.teamId,p_plan:data.campaignPlanId,
   p_movement:data.movementId,p_variant:data.variantId,p_notes:data.notes
  });
  if(error)throw error;
  const row=rows?.[0];
  if(!row)throw new Error("Associação planejada não registrada.");
  return {id:String(row.saved_id),notice:"Associação planejada e auditada. Nenhuma publicação ou venda foi registrada."};
 });
export const changeRubiTeamCampaignAssignmentStatusAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>changeStatus.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_transition_team_campaign_assignment_audited",{
   p_actor:context.userId,p_id:data.id,p_status:data.status,p_expected_status:data.expectedStatus
  });
  if(error)throw error;
  const row=rows?.[0];
  if(!row)throw new Error("Decisão não registrada.");
  return {id:String(row.saved_id),notice:"Estado auditado. Pronto não significa publicação, venda ou verba gasta."};
 });
