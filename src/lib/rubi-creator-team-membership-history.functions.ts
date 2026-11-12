import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";

const schema=z.object({teamId:z.string().uuid()});
/** Private team history: the baseline snapshot is not evidence of earlier membership. */
export const listRubiCreatorTeamMembershipHistoryAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>schema.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:team,error:teamError}=await db.from("rubi_creator_teams")
   .select("id,name").eq("id",data.teamId).maybeSingle();
  if(teamError)throw teamError;
  if(!team)throw new Error("Time não encontrado.");
  const {data:events,error}=await db.from("rubi_creator_team_membership_events")
   .select("id,team_id,commercial_profile_id,action,status,effective_at")
   .eq("team_id",data.teamId).order("effective_at",{ascending:false})
   .order("id",{ascending:false}).limit(200);
  if(error)throw error;
  return {teamName:String(team.name),events:events??[],partial:(events??[]).length===200};
 });
