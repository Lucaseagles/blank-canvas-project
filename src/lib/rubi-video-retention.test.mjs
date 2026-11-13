import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {rubiVideoCompletionPercent} from "./rubi-video-retention.functions.ts";
const sql=readFileSync(new URL("../../supabase/migrations/20261113030000_rubi_variant_video_retention.sql",import.meta.url),"utf8");
const server=readFileSync(new URL("./rubi-video-retention.functions.ts",import.meta.url),"utf8");
test("completion cohort rate rejects absent and impossible denominators",()=>{
 assert.equal(rubiVideoCompletionPercent(10,9),90);
 assert.equal(rubiVideoCompletionPercent(3,1),33.3);
 assert.equal(rubiVideoCompletionPercent(0,0),null);
 assert.equal(rubiVideoCompletionPercent(2,3),null);
 assert.equal(rubiVideoCompletionPercent(Number.NaN,1),null);
});
test("video retention query requires both start and completion for same authenticated person",()=>{
 assert.match(sql,/e\.user_id is not null/);
 assert.match(sql,/group by e\.metadata->>'video_id',e\.user_id/);
 assert.match(sql,/u\.started and u\.completed/);
 assert.match(sql,/cv\.movement_id=p_movement_id/);
 assert.match(sql,/cv\.status='review'/);
 assert.match(sql,/revoke all on function public\.rubi_variant_video_retention/);
 assert.match(sql,/grant execute on function public\.rubi_variant_video_retention\(uuid,integer,integer\) to service_role/);
});
test("server only returns bounded aggregate to Master without individual user records",()=>{
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/p_limit:100/);
 assert.match(server,/partial\?null:rubiVideoCompletionPercent/);
 assert.doesNotMatch(server,/\.select\("user_id"|return \{user_id:/);
});
