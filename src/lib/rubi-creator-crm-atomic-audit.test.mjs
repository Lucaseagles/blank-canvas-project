import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Three creator CRM mutators use atomic Owner audit with revision",()=>{
 const sql=src("../../supabase/migrations/20261113220000_rubi_creator_crm_atomic_audit.sql");
 for(const fn of ["rubi_save_creator_team_audited","rubi_save_creator_prospect_audited","rubi_save_creator_growth_targets_audited"]){
  assert.ok(sql.includes("create or replace function public."+fn));
  assert.ok(sql.includes("revoke all on function public."+fn));
  assert.ok(sql.includes("grant execute on function public."+fn));
 }
 assert.equal((sql.match(/insert into public\.admin_audit_log/g)??[]).length,3);
 assert.equal((sql.match(/security invoker set search_path=''/g)??[]).length,3);
 assert.match(sql,/previous.revision is distinct from p_expected_revision/);
 assert.doesNotMatch(sql,/security definer/);
});
test("Creator CRM admin uses RPC-only writes and client version checks",()=>{
 const api=src("./rubi-creator-teams.functions.ts");
 for(const fn of ["rubi_save_creator_team_audited","rubi_save_creator_prospect_audited","rubi_save_creator_growth_targets_audited"]){
  assert.ok(api.includes('.rpc("'+fn+'"'));
 }
 assert.equal((api.match(/p_actor:context.userId/g)??[]).length,3);
 assert.doesNotMatch(api,/\.upsert\(|\.insert\(|\.update\(\{/);
 assert.match(src("../components/partner/RubiCreatorTeamsAdmin.tsx"),/revision:number/);
 assert.match(src("../components/partner/RubiCreatorTeamGrowthAdmin.tsx"),/revision:targets\?\.revision\?\?null/);
});
