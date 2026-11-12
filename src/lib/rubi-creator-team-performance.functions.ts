import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";
import {summarizeRubiCreatorTeamsPerformance} from "./rubi-creator-team-performance";

/** Owner-only bounded diagnostic. No commission, settled revenue or ROI inference. */
export const getRubiCreatorTeamPerformanceAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const since=new Date(Date.now()-30*86400000).toISOString();
  const [t,m,l,v,s]=await Promise.all([
   db.from("rubi_creator_teams").select("id,name,niche").order("created_at",{ascending:false}).limit(100),
   db.from("rubi_creator_team_members").select("team_id,commercial_profile_id,status,joined_at").limit(500),
   db.from("hub_partner_referral_links").select("id,commercial_profile_id").limit(1000),
   db.from("hub_partner_referral_visits").select("referral_link_id,visited_at")
    .gte("visited_at",since).order("visited_at",{ascending:false}).limit(1000),
   db.from("hub_partner_confirmed_sales").select("referral_link_id,confirmed_at")
    .gte("confirmed_at",since).order("confirmed_at",{ascending:false}).limit(1000)
  ]);
  for(const result of [t,m,l,v,s])if(result.error)throw result.error;
  const teams=t.data??[],members=m.data??[],links=l.data??[],visits=v.data??[],sales=s.data??[];
  const totals=summarizeRubiCreatorTeamsPerformance(teams,members,links,visits,sales);
  const partial=teams.length===100||members.length===500||links.length===1000||
   visits.length===1000||sales.length===1000;
  return {periodDays:30,teams:teams.map((team:any)=>({...team,...totals.find(row=>row.teamId===team.id)})),
   partial,asOf:new Date().toISOString()};
 });
