import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Campaign draft creation/updates and Owner audit are atomic and private",()=>{
 const sql=read("../../supabase/migrations/20261113150000_rubi_campaign_draft_atomic_audit.sql");
 assert.match(sql,/create or replace function public\.rubi_save_master_campaign_draft_audited/);
 assert.match(sql,/security invoker set search_path=''/);
 assert.match(sql,/r\.user_id=p_actor and r\.role='owner'/);
 assert.match(sql,/p_expected_revision is distinct from prior\.revision/);
 assert.match(sql,/prior\.status not in \('draft','ready_for_review','paused'\)/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/RUBI_CAMPAIGN_DRAFT_UPDATED/);
 assert.match(sql,/revoke all on function public\.rubi_save_master_campaign_draft_audited/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(sql,/security definer/);
});
test("Master campaign server has no untracked direct insert/update",()=>{
 const api=read("./rubi-master-campaign-plans.functions.ts");
 const draft=api.slice(api.indexOf("export const saveRubiMasterCampaignPlanAdmin"),api.indexOf("export const transitionRubiMasterCampaignPlanAdmin"));
 assert.match(draft,/\.middleware\(\[requireOwnerRole\]\)/);
 assert.match(draft,/\.rpc\("rubi_save_master_campaign_draft_audited"/);
 assert.match(draft,/p_actor:context\.userId/);
 assert.match(draft,/p_expected_revision:data\.revision\?\?null/);
 assert.doesNotMatch(draft,/\.insert\(|\.update\(/);
 assert.match(api,/\.rpc\("rubi_transition_campaign_audited"/);
});
