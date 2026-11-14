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
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_register_team_publication_audited",{
   p_actor:context.userId,p_assignment:data.assignmentId,p_membership:data.membershipId,
   p_channel:data.channel,p_url:data.publicationUrl,p_published_at:data.publishedAt
  });
  if(error)throw error;
  if(!rows?.[0]?.saved_id)throw new Error("Publicação e auditoria não registradas.");
  return {id:String(rows[0].saved_id),notice:"Referência registrada como enviada; ainda requer revisão humana."};
 });

export const reviewRubiTeamPublicationAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>reviewSchema.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_review_team_publication_audited",{
   p_actor:context.userId,p_id:data.id,p_decision:data.status,p_notes:data.notes
  });
  if(error)throw error;
  if(!rows?.[0]?.saved_id)throw new Error("Revisão e auditoria não registradas.");
  return {id:String(rows[0].saved_id),notice:"Revisão editorial registrada. Não certifica impressões ou pagamentos."};
 });
