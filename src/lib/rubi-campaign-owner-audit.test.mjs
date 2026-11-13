import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const sql=source("../../supabase/migrations/20261113070000_rubi_campaign_owner_atomic_audit.sql");
const server=source("./rubi-master-campaign-plans.functions.ts");
test("campaign status and named Owner log share a database transaction",()=>{
 assert.match(sql,/create or replace function public\.rubi_transition_campaign_audited/);
 assert.match(sql,/for update/);
 assert.match(sql,/update public\.rubi_master_campaign_plans/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/RUBI_CAMPAIGN_APPROVED/);
 assert.match(sql,/RUBI_CAMPAIGN_PAUSED/);
 assert.match(sql,/RUBI_CAMPAIGN_SUBMITTED/);
 assert.match(sql,/r\.user_id=p_actor and r\.role='owner'/);
 assert.match(sql,/revoke all on function public\.rubi_transition_campaign_audited/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(sql,/security definer/);
});
test("campaign transitions keep checkout gate and take actor only from auth context",()=>{
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/approvedRubiCheckout\(product\)/);
 assert.match(server,/p_actor:context\.userId/);
 assert.match(server,/rpc\("rubi_transition_campaign_audited"/);
 assert.doesNotMatch(server,/\.from\("admin_audit_log"\)\.insert/);
});
test("audit excludes confidential campaign claims and reviewer notes",()=>{
 const insertion=sql.slice(sql.indexOf("insert into public.admin_audit_log"));
 assert.doesNotMatch(insertion,/current_plan\.claim_evidence|current_plan\.approval_note|p_note[,)]/);
 assert.match(insertion,/product_id/);
});
