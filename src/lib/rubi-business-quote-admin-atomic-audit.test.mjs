import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
const api=read("./hub-business-quotes.functions.ts");
const migration=read("../../supabase/migrations/20261126123000_rubi_business_quote_admin_atomic_audit.sql");
const quoteUi=read("../components/business/RubiBusinessQuotesAdmin.tsx");
const smoke=read("../../scripts/rubi-local-business-quote-admin-audit-smoke.sql");
const followupUi=read("../components/business/RubiBusinessFollowupsAdmin.tsx");

test("Owner quote status updates use the atomic audited RPC, not direct table DML",()=>{
 assert.match(api,/updateHubBusinessQuoteAdmin[\s\S]*?\.middleware\(\[requireOwnerRole\]\)/);
 assert.match(api,/rubi_update_business_quote_admin_audited/);
 assert.doesNotMatch(api,/export const updateHubBusinessQuoteAdmin[\s\S]*?\.from\(["']hub_b2b_quote_requests["']\)[\s\S]*?\.update\(/);
 assert.match(api,/expectedUpdatedAt:\s*z\.string\(\)\.datetime/);
});

test("Owner follow-up completion is atomic, audited and concurrency guarded",()=>{
 assert.match(api,/rubi_complete_business_followup_admin_audited/);
 assert.doesNotMatch(api,/export const completeHubBusinessFollowupAdmin[\s\S]*?\.from\(["']hub_b2b_quote_requests["']\)[\s\S]*?\.update\(/);
 assert.match(followupUi,/expectedUpdatedAt:item\.updated_at/);
 assert.match(followupUi,/updated_at/);
});

test("both SQL functions lock rows, enforce Owner, redact note values and audit in transaction",()=>{
 for(const fn of ["rubi_update_business_quote_admin_audited","rubi_complete_business_followup_admin_audited"]){
  const start=migration.indexOf("create or replace function public."+fn+"(");
  assert.ok(start>=0,fn);
  const end=migration.indexOf("$fn$;",start);
  const body=migration.slice(start,end);
  for(const token of ["security invoker","for update","Owner authorization required","insert into public.admin_audit_log","p_actor"]) assert.ok(body.includes(token),fn+" "+token);
 }
 assert.match(migration,/revoke all on function[\s\S]*from public,anon,authenticated/);
 assert.match(migration,/grant execute on function[\s\S]*to service_role/);
 assert.match(migration,/Business quote changed; reload before saving/);
 assert.match(migration,/Business follow-up changed; reload before completing/);
 assert.match(migration,/values_redacted/);
 assert.doesNotMatch(migration,/p_owner_note\s*,\s*'owner_note'/);
});

test("local PostgreSQL smoke proves rollback, Owner rejection, grants and lifecycle",()=>{
 for(const token of ["RUBI_QA_FORCED_BUSINESS_QUOTE_AUDIT_FAILURE","rubi_update_business_quote_admin_audited","rubi_complete_business_followup_admin_audited","RUBI_QA_EXPECTED_STALE_BUSINESS_QUOTE_REJECTION_NOT_RAISED","private QA reply text","ROLLBACK;"]) assert.ok(smoke.includes(token),token);
});

test("quote UI passes the version it rendered to prevent stale overwrite",()=>{
 assert.match(quoteUi,/expectedUpdatedAt/);
 assert.match(quoteUi,/quote\.updated_at/);
});
