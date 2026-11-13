import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const sql=source("../../supabase/migrations/20261113073000_rubi_variant_atomic_audit.sql");
const server=source("./rubi-movement-variants.functions.ts");
test("variant mutations and Master audit share transaction and actor",()=>{
 assert.match(sql,/p_action not in \('create','update','delete'\)/);
 assert.match(sql,/insert into public\.rubi_movement_variants/);
 assert.match(sql,/update public\.rubi_movement_variants/);
 assert.match(sql,/delete from public\.rubi_movement_variants/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/for update/);
 assert.match(sql,/revision is distinct from p_expected_revision/);
 assert.match(sql,/r\.user_id=p_actor and r\.role='owner'/);
 assert.match(sql,/revoke all on function public\.rubi_mutate_variant_audited/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(sql,/security definer/);
});
test("server preserves creative review gate and prevents client-supplied reviewer",()=>{
 assert.match(server,/requireOwnerRole/g);
 assert.match(server,/canReviewRubiVariant\(data\)/);
 assert.match(server,/p_actor:context\.userId/g);
 assert.match(server,/rpc\("rubi_mutate_variant_audited"/g);
 assert.doesNotMatch(server,/\.from\("rubi_movement_variants"\)\s*\.update/);
 assert.doesNotMatch(server,/\.from\("rubi_movement_variants"\)\s*\.delete/);
});
test("audit excludes source creative, media proof and detailed claims",()=>{
 const audit=sql.slice(sql.indexOf("insert into public.admin_audit_log"));
 assert.doesNotMatch(audit,/current_variant\.creative_script|current_variant\.proof_notes|current_variant\.page_body|p_values->>'creative_script'/);
 assert.match(audit,/new_revision/);
});
