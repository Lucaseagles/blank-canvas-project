import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("Master candidate proposal/cancellation are atomic and role-neutral",()=>{
 const sql=read("../../supabase/migrations/20261114001000_rubi_master_candidate_atomic_audit.sql");
 assert.match(sql,/create or replace function public\.rubi_decide_master_candidate_audited/);
 assert.match(sql,/security invoker set search_path=''/);
 assert.match(sql,/r\.user_id=p_actor and r\.role='owner'/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/RUBI_MASTER_CANDIDATE_PROPOSED/);
 assert.match(sql,/RUBI_MASTER_CANDIDATE_CANCELLED/);
 assert.match(sql,/revoke all on function public\.rubi_decide_master_candidate_audited/);
 assert.match(sql,/to service_role/);
 assert.match(sql,/access_granted',false/);
 assert.doesNotMatch(sql,/insert into public\.user_roles|update public\.user_roles|grant owner/);
});
test("Master candidates never directly mutate SQL tables or grant privileged role",()=>{
 const api=read("./rubi-master-candidates.functions.ts");
 assert.equal((api.match(/rpc\("rubi_decide_master_candidate_audited"/g)??[]).length,2);
 assert.equal((api.match(/p_actor:context\.userId/g)??[]).length,2);
 assert.doesNotMatch(api,/\.upsert\(|\.update\(|\.insert\(/);
 assert.match(api,/accessGranted:false/);
 assert.match(api,/canProposeMasterCandidate/);
});
