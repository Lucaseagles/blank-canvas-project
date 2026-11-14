import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";

const fitSchema=z.object({
 prospectId:z.string().uuid(),expectedRevision:z.number().int().positive().nullable(),
 nicheFit:z.number().int().min(0).max(2),audienceOverlap:z.number().int().min(0).max(2),
 engagementQuality:z.number().int().min(0).max(2),contentQuality:z.number().int().min(0).max(2),
 complianceReadiness:z.number().int().min(0).max(2),
 evidence:z.string().trim().min(30).max(1500)
});
/** Master review supports prioritization only; never sets approval, agreements, grants or commissions. */
export const reviewRubiCreatorFitAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>fitSchema.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_review_creator_fit_audited",{
   p_actor:context.userId,p_prospect:data.prospectId,p_expected_revision:data.expectedRevision,
   p_niche:data.nicheFit,p_audience:data.audienceOverlap,p_engagement:data.engagementQuality,
   p_content:data.contentQuality,p_compliance:data.complianceReadiness,p_evidence:data.evidence
  });
  if(error)throw error;
  if(!rows?.length)throw new Error("Diagnóstico e auditoria não registrados.");
  return {score:Number(rows[0].saved_score),recommendation:String(rows[0].saved_recommendation)};
 });
