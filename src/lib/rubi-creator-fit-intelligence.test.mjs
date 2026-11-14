import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("RUBI fit engine records a human decision and guards privileged operations",()=>{
 const sql=read("../../supabase/migrations/20261114060000_rubi_creator_fit_review.sql");
 assert.match(sql,/create table if not exists public\.rubi_creator_fit_reviews/);
 assert.match(sql,/unique references public\.rubi_creator_prospects/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public\.rubi_creator_fit_reviews from public,anon,authenticated/);
 assert.match(sql,/grant select,insert,update on public\.rubi_creator_fit_reviews to service_role/);
 assert.match(sql,/r\.user_id=p_actor and r\.role='owner'/);
 assert.match(sql,/security invoker set search_path=''/);
 assert.match(sql,/p_expected_revision/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/p_compliance<2 or p_niche=0 or p_audience=0/);
 assert.match(sql,/next_recommendation/);
 assert.match(sql,/p_niche\*10 \+ p_audience\*10 \+ p_engagement\*10 \+ p_content\*5 \+ p_compliance\*15/);
 assert.doesNotMatch(sql,/insert into public\.hub_partner_product_grants|update public\.commercial_profiles|insert into public\.hub_partner_agreements/);
});
test("CRM renders a guided, transparent assessment, no automated approvals",()=>{
 const ui=read("../components/partner/RubiCreatorFitReviewAdmin.tsx");
 const admin=read("../components/partner/RubiCreatorTeamsAdmin.tsx");
 const api=read("./rubi-creator-fit.functions.ts");
 assert.match(ui,/Seu|Nicho e produto/);
 assert.match(ui,/engagementQuality/);
 assert.match(ui,/complianceReadiness/);
 assert.match(ui,/evidence.trim\(\).length<30/);
 assert.match(ui,/Uma nota alta não aprova o parceiro/);
 assert.match(admin,/RubiCreatorFitReviewAdmin/);
 assert.match(api,/requireOwnerRole/);
 assert.match(api,/rpc\("rubi_review_creator_fit_audited"/);
 assert.match(api,/p_actor:context.userId/);
 assert.doesNotMatch(api,/\.insert\(|\.update\(|\.upsert\(/);
});
test("legacy commercial profile approval cannot bypass owner audit",()=>{
 const legacy=read("./commercial-admin.functions.ts");
 assert.match(legacy,/rpc\("rubi_decide_commercial_profile_audited"/);
 assert.match(legacy,/p_actor:context.userId/);
 assert.doesNotMatch(legacy,/\.update\(|\.upsert\(/);
});
