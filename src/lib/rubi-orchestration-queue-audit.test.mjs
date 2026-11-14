import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("orchestration queue validates owner, approval, association, adapter and atomic audit",()=>{
 const sql=read("../../supabase/migrations/20261114110000_rubi_orchestration_queue_atomic.sql");
 const src=read("./admin-publishing.functions.ts");
 const section=src.slice(src.indexOf("export const prepareStrategyPublishing"));
 for (const pattern of [/security invoker/,/pg_advisory_xact_lock/,/strategy_orchestrations/,/status='approved'/,/strategy_orchestration_videos/,/campaign_channels/,/channel='telegram'/,/already_queued/,/insert into public\.scheduled_posts/,/insert into public\.admin_audit_log/,/RUBI_ORCHESTRATION_POST_QUEUED/,/grant execute on function[\s\S]*to service_role/]) assert.match(sql,pattern);
 assert.match(section,/rpc\("rubi_queue_orchestration_video_audited"/);
 assert.match(section,/p_actor: context\.userId/);
 assert.doesNotMatch(section,/\.from\("scheduled_posts"\)\.insert\(/);
 assert.doesNotMatch(sql,/jsonb_build_object\([^;]*message_template/);
});
