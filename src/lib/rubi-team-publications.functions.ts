import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
const uuid=z.string().uuid();
const evidenceSchema=z.object({
 assignmentId:uuid,membershipId:uuid,
 channel:z.enum(["instagram","tiktok","youtube","facebook","pinterest","whatsapp","telegram","other"]),
 publicationUrl:z.string().trim().url().max(500).refine(v=>{
  try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&!u.hash;}catch{return false;}
 },"Insira URL HTTPS pública sem credenciais ou fragmento."),
 publishedAt:z.string().datetime({offset:true})
});
const reviewSchema=z.object({id:uuid,status:z.enum(["reviewed","rejected"]),notes:z.string().trim().min(10).max(1000)});

/** Owner-only publication evidence. URL review does not verify purchase, visits or commissions. */
export const listRubiTeamPublicationsAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const [assignments,memberships,profiles,evidence]=await Promise.all([
   db.from("rubi_creator_team_campaign_assignments").select("id,team_id,variant_id,status")
    .order("created_at",{ascending:false}).limit(200),
   db.from("rubi_creator_team_members").select("id,team_id,commercial_profile_id,status,joined_at")
    .limit(500),
   db.from("commercial_profiles").select("id,display_name").eq("audience","partner").eq("status","approved").limit(500),
   db.from("rubi_creator_team_publication_evidence")
    .select("id,assignment_id,membership_id,channel,publication_url,published_at,review_status,review_notes,created_at")
    .order("created_at",{ascending:false}).limit(300)
  ]);
  for(const r of [assignments,memberships,profiles,evidence])if(r.error)throw r.error;
  return {assignments:assignments.data??[],memberships:memberships.data??[],
   profiles:profiles.data??[],publications:evidence.data??[],
   partial:(assignments.data??[]).length===200||(memberships.data??[]).length===500||
    (profiles.data??[]).length===500||(evidence.data??[]).length===300};
 });

export const registerRubiTeamPublicationAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>evidenceSchema.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const [assignmentResult,memberResult]=await Promise.all([
   db.from("rubi_creator_team_campaign_assignments")
    .select("id,team_id,status").eq("id",data.assignmentId).maybeSingle(),
   db.from("rubi_creator_team_members")
    .select("id,team_id,commercial_profile_id,status,joined_at").eq("id",data.membershipId).maybeSingle()
  ]);
  if(assignmentResult.error)throw assignmentResult.error;
  if(memberResult.error)throw memberResult.error;
  const assignment=assignmentResult.data,member=memberResult.data;
  if(!assignment||assignment.status!=="ready")throw new Error("A associação precisa estar pronta para revisão.");
  if(!member||member.team_id!==assignment.team_id||member.status!=="active")
   throw new Error("Selecione um integrante ativo do mesmo time.");
  const {data:profile,error:profileError}=await db.from("commercial_profiles").select("id")
   .eq("id",member.commercial_profile_id).eq("audience","partner").eq("status","approved").maybeSingle();
  if(profileError)throw profileError;
  if(!profile)throw new Error("O parceiro não está mais aprovado.");
  const at=Date.parse(data.publishedAt);
  if(!Number.isFinite(at)||at<Date.parse(member.joined_at)||at>Date.now()+300000)
   throw new Error("A data de publicação deve estar após a entrada no time e não pode estar no futuro.");
  // A member who is active today may have been paused on the publication date.
  const {data:membershipState,error:historyError}=await db.from("rubi_creator_team_membership_events")
   .select("status,effective_at").eq("membership_id",member.id)
   .lte("effective_at",data.publishedAt).order("effective_at",{ascending:false})
   .order("id",{ascending:false}).limit(1).maybeSingle();
  if(historyError)throw historyError;
  if(!membershipState||membershipState.status!=="active")
   throw new Error("Não há vínculo ativo comprovado na data informada da publicação.");
  const {data:row,error}=await db.from("rubi_creator_team_publication_evidence").insert({
   assignment_id:data.assignmentId,membership_id:data.membershipId,channel:data.channel,
   publication_url:data.publicationUrl,published_at:data.publishedAt
  }).select("id").single();
  if(error)throw error;
  return {id:String(row.id),notice:"Referência registrada como enviada; ainda requer revisão humana."};
 });

export const reviewRubiTeamPublicationAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>reviewSchema.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:row,error}=await db.from("rubi_creator_team_publication_evidence").update({
   review_status:data.status,review_notes:data.notes,reviewed_at:new Date().toISOString(),
   updated_at:new Date().toISOString()
  }).eq("id",data.id).eq("review_status","submitted").select("id").maybeSingle();
  if(error)throw error;
  if(!row)throw new Error("Referência não localizada ou já revisada.");
  return {id:String(row.id),notice:"Revisão editorial registrada. Não certifica impressões ou pagamentos."};
 });
