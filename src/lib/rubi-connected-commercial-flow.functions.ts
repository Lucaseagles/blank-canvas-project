import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";

export type RubiConnectedFlowCounts={
 products:number;plansApproved:number;teams:number;membersActive:number;
 assignmentsReady:number;publicationsSubmitted:number;publicationsReviewed:number;
};
/** Exact database counts of distinct stages, not a joined, completed sale funnel. */
export const getRubiConnectedCommercialFlowAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const checks=[
   ["products",db.from("hub_products").select("id",{count:"exact",head:true})],
   ["plansApproved",db.from("rubi_master_campaign_plans").select("id",{count:"exact",head:true}).eq("status","approved").eq("mode","creator_team")],
   ["teams",db.from("rubi_creator_teams").select("id",{count:"exact",head:true})],
   ["membersActive",db.from("rubi_creator_team_members").select("id",{count:"exact",head:true}).eq("status","active")],
   ["assignmentsReady",db.from("rubi_creator_team_campaign_assignments").select("id",{count:"exact",head:true}).eq("status","ready")],
   ["publicationsSubmitted",db.from("rubi_creator_team_publication_evidence").select("id",{count:"exact",head:true}).eq("review_status","submitted")],
   ["publicationsReviewed",db.from("rubi_creator_team_publication_evidence").select("id",{count:"exact",head:true}).eq("review_status","reviewed")]
  ] as const;
  const responses=await Promise.all(checks.map(async ([key,query])=>{
   const {count,error}=await query;
   if(error)throw error;
   if(typeof count!=="number")throw new Error("Não foi possível confirmar o total de "+key);
   return [key,count] as const;
  }));
  return {counts:Object.fromEntries(responses) as RubiConnectedFlowCounts,asOf:new Date().toISOString(),
   disclaimer:"Totais de fases independentes; não representam a mesma coorte, checkout, venda, comissão ou fluxo concluído."};
 });
