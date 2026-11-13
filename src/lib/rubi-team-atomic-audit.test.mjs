import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("RUBI 178 audited membership and campaign assignments retain atomic Owner logs",()=>{
 const sql=source("../../supabase/migrations/20261113210000_rubi_team_decisions_atomic_audit.sql");
 for(const fn of ["rubi_set_team_membership_audited","rubi_create_team_campaign_assignment_audited","rubi_transition_team_campaign_assignment_audited"]){
  assert.ok(sql.includes("create or replace function public."+fn));
  assert.ok(sql.includes("revoke all on function public."+fn));
  assert.ok(sql.includes("grant execute on function public."+fn));
 }
 assert.equal((sql.match(/insert into public\.admin_audit_log/g)??[]).length,3);
 assert.equal((sql.match(/security invoker set search_path=''/g)??[]).length,3);
 assert.doesNotMatch(sql,/security definer/);
 assert.match(sql,/existing.status is distinct from p_expected_status/);
 assert.match(sql,/previous.status is distinct from p_expected_status/);
 assert.match(sql,/profile_status<>'approved'/);
 assert.match(sql,/variant_row.media_rights_confirmed is distinct from true/);
});
test("Master server and UI never bypass audited team mutation procedures",()=>{
 const member=source("./rubi-creator-team-members.functions.ts");
 const campaigns=source("./rubi-team-campaign-assignments.functions.ts");
 const uiMember=source("../components/partner/RubiCreatorTeamMembersAdmin.tsx");
 const uiCampaign=source("../components/partner/RubiTeamCampaignAssignmentsAdmin.tsx");
 assert.match(member,/rpc\("rubi_set_team_membership_audited"/);
 assert.match(campaigns,/rpc\("rubi_create_team_campaign_assignment_audited"/);
 assert.match(campaigns,/rpc\("rubi_transition_team_campaign_assignment_audited"/);
 assert.match(member,/p_actor:context.userId/);
 assert.match(campaigns,/p_actor:context.userId/);
 assert.match(uiMember,/expectedStatus/);
 assert.match(uiCampaign,/expectedStatus/);
 assert.doesNotMatch(member,/\.upsert\(/);
 assert.doesNotMatch(campaigns,/\.update\(\{/);
});
