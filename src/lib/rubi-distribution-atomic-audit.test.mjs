import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const sql=source("../../supabase/migrations/20261113080000_rubi_distribution_atomic_audit.sql");
const server=source("./rubi-movement-distribution.functions.ts");
const model=source("./rubi-movement-distribution.ts");
test("distribution edits and Master audit are committed atomically",()=>{
 assert.match(sql,/create or replace function public\.rubi_save_distribution_audited/);
 assert.match(sql,/insert into public\.rubi_movement_distribution/);
 assert.match(sql,/update public\.rubi_movement_distribution/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/for update/);
 assert.match(sql,/old_plan\.revision is distinct from p_expected_revision/);
 assert.match(sql,/page_published_at=null,published_variant_revision=null/);
 assert.match(sql,/r\.user_id=p_actor and r\.role='owner'/);
 assert.match(sql,/revoke all on function public\.rubi_save_distribution_audited/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(sql,/security definer/);
});
test("server binds actor to owner session, checks collisions and revisions",()=>{
 assert.match(server,/requireOwnerRole/g);
 assert.match(server,/p_actor:context\.userId/);
 assert.match(server,/p_expected_revision:data\.revision\?\?null/);
 assert.match(server,/rpc\("rubi_save_distribution_audited"/);
 assert.match(server,/Identificador de campanha já utilizado/);
 assert.match(server,/canRecordPublication\(data\)/);
 assert.match(model,/revision\?:number/);
 assert.doesNotMatch(server,/\.from\("rubi_movement_distribution"\)\s*\.update/);
});
test("private notes and published references never enter audit payload",()=>{
 const log=sql.slice(sql.indexOf("insert into public.admin_audit_log"));
 assert.doesNotMatch(log,/p_notes|p_published_reference|old_plan\.notes/);
 assert.match(log,/campaign/);
});
