import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("social strategy mutations are Owner-checked and audited atomically",()=>{
 const api=read("./social-strategy.functions.ts");
 const sql=read("../supabase/migrations/20261116190000_rubi_social_strategy_atomic_audit.sql");
 const section=api.slice(api.indexOf("export const saveSocialStrategy"),api.length);
 assert.equal((section.match(/rpc\("rubi_manage_social_strategy_audited"/g)||[]).length,2);
 assert.equal((section.match(/p_actor: context\.userId/g)||[]).length,2);
 assert.doesNotMatch(section,/\.insert\(|\.delete\(|\.update\(|append_admin_audit/);
 assert.match(sql,/security invoker/);
 assert.match(sql,/Owner authorization required/);
 assert.match(sql,/for update/);
 assert.match(sql,/RUBI_SOCIAL_STRATEGY_CREATED/);
 assert.match(sql,/RUBI_SOCIAL_STRATEGY_UPDATED/);
 assert.match(sql,/RUBI_SOCIAL_STRATEGY_DELETED/);
 assert.equal((sql.match(/insert into public\.admin_audit_log/g)||[]).length,2);
 assert.match(sql,/revoke insert,update,delete on public\.social_channel_strategies/);
 assert.match(sql,/to service_role/);
 assert.match(sql,/sanitize_admin_audit_json/);
});
