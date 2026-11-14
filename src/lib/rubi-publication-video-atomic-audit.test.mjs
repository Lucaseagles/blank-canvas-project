import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("Page publication and video associations have locked and audited Owner transactions",()=>{
 const sql=source("../../supabase/migrations/20261114010000_rubi_publication_video_atomic_audit.sql");
 for(const fn of ["rubi_set_movement_page_publication_audited","rubi_set_variant_video_link_audited"]){
  assert.ok(sql.includes("create or replace function public."+fn));
  assert.ok(sql.includes("revoke all on function public."+fn));
  assert.ok(sql.includes("grant execute on function public."+fn));
 }
 assert.equal((sql.match(/insert into public\.admin_audit_log/g)??[]).length,2);
 assert.equal((sql.match(/security invoker set search_path=''/g)??[]).length,2);
 assert.match(sql,/plan_row.revision<>p_expected_revision/);
 assert.match(sql,/variant_row.media_rights_confirmed is distinct from true/);
 assert.match(sql,/product_row.checkout_verified/);
 assert.match(sql,/published_variant_revision=variant_row.revision/);
 assert.match(sql,/page_published_at=null/);
 assert.match(sql,/for update/);
 assert.match(sql,/r\.role='owner'/);
 assert.doesNotMatch(sql,/security definer/);
});

test("New Master operations require current plan version and avoid direct mutations",()=>{
 const publishing=source("./rubi-movement-publishing.functions.ts");
 const video=source("./rubi-variant-video-links.functions.ts");
 const panel=source("../components/store/RubiMovementDistributionAdmin.tsx");
 assert.match(publishing,/rpc\("rubi_set_movement_page_publication_audited"/);
 assert.match(publishing,/p_expected_revision:data.expectedRevision/);
 assert.match(video,/rpc\("rubi_set_variant_video_link_audited"/);
 assert.equal((video.match(/p_actor:context.userId/g)??[]).length,2);
 assert.match(panel,/expectedRevision:draft.revision/);
 assert.doesNotMatch(video,/\.insert\(|\.delete\(|\.upsert\(/);
 const operation=publishing.slice(publishing.indexOf("export const setRubiMovementPagePublishedAdmin"),publishing.indexOf("export const getRubiMovementPublishedPage"));
 assert.doesNotMatch(operation,/\.update\(|\.insert\(/);
});
