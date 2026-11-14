import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Story drafts and Store sections are audited with an Owner and revision check",()=>{
 const sql=read("../../supabase/migrations/20261114020000_rubi_story_storefront_writes_atomic_audit.sql");
 for(const fn of ["rubi_save_story_draft_audited","rubi_save_storefront_section_audited"]){
  assert.ok(sql.includes("create or replace function public."+fn));
  assert.ok(sql.includes("revoke all on function public."+fn));
  assert.ok(sql.includes("grant execute on function public."+fn));
 }
 assert.equal((sql.match(/insert into public\.admin_audit_log/g)??[]).length,2);
 assert.equal((sql.match(/security invoker set search_path=''/g)??[]).length,2);
 assert.match(sql,/prior.revision is distinct from p_expected_revision/);
 assert.match(sql,/approved_movement_revision=null/);
 assert.match(sql,/p.checkout_verified/);
 assert.match(sql,/cardinality\(p_products\)/);
 assert.match(sql,/s.checkout_host/);
 assert.doesNotMatch(sql,/security definer/);
});
test("Story drafts and Store sections have no unaudited insert/update paths",()=>{
 const story=read("./rubi-product-stories.functions.ts");
 const section=read("./rubi-storefront-sections.functions.ts");
 const writeStory=story.slice(story.indexOf("export const saveRubiProductStoryAdmin"),story.indexOf("export const setRubiProductStoryApprovalAdmin"));
 const writeSection=section.slice(section.indexOf("export const saveRubiStorefrontSectionAdmin"),section.indexOf("export const getRubiStorefrontPublishedSections"));
 assert.match(writeStory,/rpc\("rubi_save_story_draft_audited"/);
 assert.match(writeSection,/rpc\("rubi_save_storefront_section_audited"/);
 assert.match(writeStory,/p_actor:context.userId/);
 assert.match(writeSection,/p_actor:context.userId/);
 assert.match(writeStory,/p_expected_revision:data.revision\?\?null/);
 assert.match(writeSection,/p_expected_revision:data.revision\?\?null/);
 assert.doesNotMatch(writeStory,/\.insert\(|\.update\(/);
 assert.doesNotMatch(writeSection,/\.insert\(|\.update\(/);
});
