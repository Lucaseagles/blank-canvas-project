import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {canProposeMasterCandidate} from "./rubi-master-candidates";
const emailSchema=z.string().trim().toLowerCase().email().max(254);

/** Solo-master control panel: future candidates do NOT receive any authorization. */
export const listRubiMasterCandidatesAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).from("rubi_master_delegations")
   .select("email,status,created_at,updated_at").order("created_at",{ascending:false}).limit(100);
  if(error)throw error;
  return {ownerOnly:true,candidates:(rows??[]) as Array<{email:string;status:"pending"|"cancelled";created_at:string;updated_at:string}>,
   note:"A inclusão nesta lista NÃO cria usuário, convite de acesso, papel owner nem permissão Master."};
 });
export const proposeRubiMasterCandidateAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({email:emailSchema}).parse(input))
 .handler(async({data,context})=>{
  if(!canProposeMasterCandidate(data.email)||data.email===context.userEmail?.trim().toLowerCase())
    throw new Error("E-mail não elegível para pré-cadastro.");
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_decide_master_candidate_audited",{
   p_actor:context.userId,p_email:data.email,p_action:"propose"
  });
  if(error)throw error;
  if(rows?.[0]?.saved_status!=="pending")throw new Error("Candidato não registrado.");
  return {saved:true,accessGranted:false};
 });
export const cancelRubiMasterCandidateAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({email:emailSchema}).parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_decide_master_candidate_audited",{
   p_actor:context.userId,p_email:data.email,p_action:"cancel"
  });
  if(error)throw error;
  if(rows?.[0]?.saved_status!=="cancelled")throw new Error("Cancelamento não registrado.");
  return {cancelled:true};
 });
