import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Module toggles, order and badges use atomic, version-checked Owner audit",()=>{
 const sql=read("../../supabase/migrations/20261114040000_rubi_home_badges_atomic_audit.sql");
 for(const fn of ["rubi_set_home_module_enabled_audited","rubi_reorder_home_modules_audited","rubi_set_badge_enabled_audited"]){
  assert.ok(sql.includes("create or replace function public."+fn));
  assert.ok(sql.includes("revoke all on function public."+fn));
  assert.ok(sql.includes("grant execute on function public."+fn));
 }
 assert.equal((sql.match(/insert into public\.admin_audit_log/g)??[]).length,3);
 assert.equal((sql.match(/security invoker set search_path=''/g)??[]).length,3);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/previous_ids<>p_expected_ids/);
 assert.match(sql,/prior.is_enabled is distinct from p_expected/);
 assert.match(sql,/for update/);
 assert.match(sql,/r.role='owner'/);
 assert.doesNotMatch(sql,/security definer/);
});
test("Admin modules API makes no separate untracked DML and passes expected state",()=>{
 const api=read("./admin-modules.functions.ts");
 assert.match(api,/rpc\("rubi_set_home_module_enabled_audited"/);
 assert.match(api,/rpc\("rubi_reorder_home_modules_audited"/);
 assert.match(api,/rpc\("rubi_set_badge_enabled_audited"/);
 assert.equal((api.match(/p_actor:context\.userId/g)??[]).length,3);
 assert.doesNotMatch(api,/\.insert\(|\.update\(|\.upsert\(/);
 const home=read("../admin/modules/HomeModulesConfig.tsx");
 const badges=read("../admin/modules/BadgeConfig.tsx");
 assert.match(home,/expected:m.is_enabled/);
 assert.match(home,/expectedIds:/);
 assert.match(badges,/expected:b.is_enabled/);
});
