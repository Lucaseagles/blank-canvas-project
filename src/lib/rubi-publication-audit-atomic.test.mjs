import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("publication evidence and manual review use named Owner audit in same transaction",()=>{
 const sql=source("../../supabase/migrations/20261113230000_rubi_publication_evidence_atomic_audit.sql");
 for(const name of ["rubi_register_team_publication_audited","rubi_review_team_publication_audited"]){
  assert.ok(sql.includes("create or replace function public."+name));
  assert.ok(sql.includes("revoke all on function public."+name));
  assert.ok(sql.includes("grant execute on function public."+name));
 }
 assert.equal((sql.match(/insert into public\.admin_audit_log/g)??[]).length,2);
 assert.equal((sql.match(/security invoker set search_path=''/g)??[]).length,2);
 assert.match(sql,/from public\.user_roles r where r\.user_id=p_actor and r\.role='owner'/);
 assert.match(sql,/historical_status<>'active'/);
 assert.match(sql,/p_published_at<m\.joined_at/);
 assert.match(sql,/prior\.review_status<>'submitted'/);
 assert.match(sql,/for update/);
 assert.doesNotMatch(sql,/security definer/);
 const audit=sql.slice(sql.indexOf("insert into public.admin_audit_log("));
 assert.doesNotMatch(audit,/jsonb_build_object\([^;]*publication_url/);
 assert.doesNotMatch(audit,/jsonb_build_object\([^;]*p_notes/);
});
test("publication handlers cannot directly insert or update audit-sensitive rows",()=>{
 const api=source("./rubi-team-publications.functions.ts");
 const mutation=api.slice(api.indexOf("export const registerRubiTeamPublicationAdmin"));
 assert.match(mutation,/rpc\("rubi_register_team_publication_audited"/);
 assert.match(mutation,/rpc\("rubi_review_team_publication_audited"/);
 assert.equal((mutation.match(/p_actor:context\.userId/g)??[]).length,2);
 assert.doesNotMatch(mutation,/\.insert\(|\.update\(/);
 assert.match(mutation,/requireOwnerRole/);
});
