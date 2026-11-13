import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const sql=read("../../supabase/migrations/20261113123000_rubi_admin_setting_atomic_audit.sql");
const server=read("./admin-settings.functions.ts");
test("all 15 settings sources have an explicit SQL allowlist, never arbitrary table selection",()=>{
 const sources=["personalization_weights","feed_mix_config","banners","social_proof_config","popup_rules",
  "ab_experiments","automation_rules","app_points_config","badges","missions",
  "compliance_rules","feature_flags","marketplaces","whatsapp_config","telegram_config"];
 for(const name of sources)assert.match(sql,new RegExp("when '"+name+"' then array"));
 assert.match(sql,/if not k=any\(permitted\)/);
 assert.match(sql,/format\('%I = \(jsonb_populate_record/);
 assert.match(sql,/if permitted is null then raise exception/);
 assert.doesNotMatch(sql,/security definer/i);
});
test("atomic audit, owner-only service role and stale-write prevention",()=>{
 assert.match(sql,/for update/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/Configuration changed; reload before saving/);
 assert.match(sql,/r\.user_id=p_actor and r\.role='owner'/);
 assert.match(sql,/revoke all on function public\.rubi_update_admin_setting_audited/);
 assert.match(sql,/to service_role/);
 assert.match(sql,/Feed mix must total 100 percent/);
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/p_actor:context\.userId/);
 assert.match(server,/rpc\("rubi_update_admin_setting_audited"/);
 assert.doesNotMatch(server,/\.from\(entry\.table\)\.update\(patch\)/);
});
test("audit payload excludes mutable values and never saves secrets in log",()=>{
 const p=sql.slice(sql.indexOf("insert into public.admin_audit_log"));
 assert.match(p,/values_redacted/);
 assert.match(p,/changed_fields/);
 assert.doesNotMatch(p,/before_row,after_row/);
 const ui=read("../routes/admin/settings.tsx");
 const alg=read("../routes/admin/algorithm-control.tsx");
 const banner=read("../routes/admin/banner-preview.tsx");
 for(const component of [ui,alg,banner])assert.match(component,/expected:/);
});
