import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const sql=source("../../supabase/migrations/20261113055000_rubi_story_atomic_audit.sql");
const stories=source("./rubi-product-stories.functions.ts");

test("Story approval and audit append are a single transactional operation",()=>{
 assert.match(sql,/create or replace function public\.rubi_set_story_approval_audited/);
 assert.match(sql,/for update/);
 assert.match(sql,/for share/);
 assert.match(sql,/update public\.rubi_product_stories/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/RUBI_STORY_APPROVED/);
 assert.match(sql,/RUBI_STORY_REVOKED/);
 assert.match(sql,/jsonb_build_object\('status'/);
 assert.doesNotMatch(sql,/security definer/);
 assert.match(sql,/revoke all on function public\.rubi_set_story_approval_audited/);
 assert.match(sql,/grant execute on function public\.rubi_set_story_approval_audited[\s\S]*to service_role/);
});
test("server maintains owner role, revision and supplier gates before atomic RPC",()=>{
 assert.match(stories,/setRubiProductStoryApprovalAdmin=createServerFn/);
 assert.match(stories,/requireOwnerRole/);
 assert.match(stories,/approvedRubiCheckout\(product\)/);
 assert.match(stories,/canApproveRubiProductStory\(story as RubiProductStory\)/);
 assert.match(stories,/p_actor:context\.userId/);
 assert.match(stories,/rpc\("rubi_set_story_approval_audited"/);
 assert.doesNotMatch(stories,/\.from\("admin_audit_log"\)\.insert/);
});
test("audit SQL has no raw story content or media URLs",()=>{
 const mutation=sql.slice(sql.indexOf("insert into public.admin_audit_log"));
 assert.doesNotMatch(mutation,/s\.video_url|s\.evidence_notes|s\.description|s\.title/);
 assert.match(sql,/Owner actor required/);
 assert.match(sql,/Story changed; reload before approving/);
});
