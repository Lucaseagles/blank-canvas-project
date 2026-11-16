import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {assessRubiAudienceEvidenceStatus} from "./rubi-audience-evidence-status";

const uuid=z.string().uuid();
const decision=z.object({
 movementId:uuid,
 movementRevision:z.number().int().positive(),
 outcome:z.enum(["needs_more_evidence","document_reviewed"]),
 reviewerNote:z.string().trim().min(20).max(1000),
 sourceReference:z.string().trim().min(12).max(500)
});
export const listRubiAudienceEvidenceReviewsAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({movementId:uuid}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:rows,error}=await db.from("rubi_audience_evidence_reviews")
   .select("id,movement_id,movement_revision,outcome,reviewer_note,source_reference,created_at")
   .eq("movement_id",data.movementId).order("created_at",{ascending:false}).limit(51);
  if(error)throw error;
  return {rows:(rows??[]).slice(0,50),partial:(rows??[]).length>50};
 });
export const recordRubiAudienceEvidenceReviewAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>decision.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:movement,error:movementError}=await db.from("rubi_movements")
   .select("id,revision,evidence_notes").eq("id",data.movementId).maybeSingle();
  if(movementError)throw movementError;
  if(!movement)throw new Error("Movimento não localizado.");
  if(movement.revision!==data.movementRevision)
   throw new Error("O movimento foi alterado. Recarregue para revisar a versão atual.");
  const evidence=String(movement.evidence_notes??"");
  const state=assessRubiAudienceEvidenceStatus(evidence);
  if(state.kind!=="declared_pending_review"||state.blockers.length!==1)
   throw new Error("Registre evidência estruturada e completa antes de revisar.");
  const {data:reviewId,error}=await db.rpc("rubi_record_audience_review_audited",{
   p_movement_id:data.movementId,p_expected_revision:data.movementRevision,
   p_outcome:data.outcome,p_reviewer_note:data.reviewerNote,
   p_source_reference:data.sourceReference,p_actor:context.userId
  });
  if(error)throw error;
  if(typeof reviewId!=="string")throw new Error("Revisão e auditoria não registradas.");
  return {id:reviewId,disclaimer:"Decisão documental interna; não comprova aceitação do público nem libera publicidade."};
 });
