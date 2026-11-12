import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";

/** Master-only publication-tagged referral landing event counts, not people or sales. */
export const getRubiCreatorTaggedVisitsAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const since=new Date(Date.now()-30*86400000).toISOString();
  const [p,a,m,t,profiles]=await Promise.all([
   db.from("rubi_creator_team_publication_evidence")
    .select("id,assignment_id,membership_id,channel,review_status,published_at")
    .eq("review_status","reviewed").order("created_at",{ascending:false}).limit(200),
   db.from("rubi_creator_team_campaign_assignments")
    .select("id,team_id,campaign_plan_id,variant_id").limit(300),
   db.from("rubi_creator_team_members")
    .select("id,team_id,commercial_profile_id").limit(500),
   db.from("rubi_creator_teams").select("id,name").limit(100),
   db.from("commercial_profiles").select("id,display_name")
    .eq("audience","partner").limit(500)
  ]);
  for(const result of [p,a,m,t,profiles])if(result.error)throw result.error;
  const posts=p.data??[],assignments=a.data??[],members=m.data??[],teams=t.data??[],names=profiles.data??[];
  const limited=posts.length===200||assignments.length===300||members.length===500||
   teams.length===100||names.length===500;
  if(limited)return {rows:[],days:30,limited:true,asOf:new Date().toISOString()};
  const ids=posts.map((post:{id:string})=>post.id);
  if(ids.length===0)return {rows:[],days:30,limited:false,asOf:new Date().toISOString()};
  const [visitResult,precheckoutResult]=await Promise.all([
   db.rpc("rubi_creator_publication_visit_counts",{p_publication_ids:ids,p_since:since}),
   db.rpc("rubi_creator_publication_precheckout_counts",{p_publication_ids:ids,p_since:since})
  ]);
  if(visitResult.error)throw visitResult.error;
  if(precheckoutResult.error)throw precheckoutResult.error;
  const byId=new Map<string,number>((visitResult.data??[]).map((row:{publication_id:string;visit_events:number|string})=>
   [row.publication_id,Number(row.visit_events)]));
  const byPrecheckout=new Map<string,number>((precheckoutResult.data??[]).map((row:{publication_id:string;precheckout_views:number|string})=>
   [row.publication_id,Number(row.precheckout_views)]));
  if([...byId.values(),...byPrecheckout.values()].some(count=>!Number.isSafeInteger(count)||count<0)||
     [...byPrecheckout.entries()].some(([id,count])=>count>(byId.get(id)??0)))
   throw new Error("Os totais de visitas e pré-checkout estão inconsistentes.");
  const byAssignment=new Map<string,any>(assignments.map((item:{id:string})=>[item.id,item]));
  const byMember=new Map<string,any>(members.map((item:{id:string})=>[item.id,item]));
  const byTeam=new Map<string,string>(teams.map((item:{id:string;name:string}):[string,string]=>[item.id,item.name]));
  const byProfile=new Map<string,string>(names.map((item:{id:string;display_name:string}):[string,string]=>[item.id,item.display_name]));
  return {rows:posts.map((post:{id:string;assignment_id:string;membership_id:string;channel:string})=>{
   const assignment=byAssignment.get(post.assignment_id),member=byMember.get(post.membership_id);
   return {publicationId:post.id,channel:post.channel,
    team:assignment?byTeam.get(assignment.team_id)??"Time não encontrado":"Associação não encontrada",
    creator:member?byProfile.get(member.commercial_profile_id)??"Perfil não encontrado":"Integrante não encontrado",
    campaignId:assignment?.campaign_plan_id??null,
    taggedVisitEvents:byId.get(post.id)??0,
    precheckoutViews:byPrecheckout.get(post.id)??0};
  }),days:30,limited:false,asOf:new Date().toISOString()};
 });
