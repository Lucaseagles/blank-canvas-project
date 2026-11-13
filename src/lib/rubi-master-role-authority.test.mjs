import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const sql=source("../../supabase/migrations/20261113090000_rubi_primary_master_roles.sql");
const server=source("./rubi-authorized-masters.functions.ts");
const panel=source("../components/admin/RubiAuthorizedMastersAdmin.tsx");
test("founding Master is immutable and no longer identified by email",()=>{
 assert.match(sql,/create table if not exists public\.rubi_primary_master/);
 assert.match(sql,/singleton integer primary key default 1 check \(singleton=1\)/);
 assert.match(sql,/owner_count <> 1/);
 assert.match(sql,/Founding Master mismatch/);
 assert.match(sql,/p_target=founding_owner/);
 assert.doesNotMatch(sql,/eaglesfr49|OWNER_EMAIL|raw_user_meta_data/);
});
test("grant and revocation are only via service role and audited atomically",()=>{
 assert.match(sql,/drop policy if exists user_roles_owner_insert/);
 assert.match(sql,/drop policy if exists user_roles_owner_delete/);
 assert.match(sql,/drop policy if exists user_roles_owner_update/);
 assert.match(sql,/revoke insert,update,delete on public\.user_roles from anon,authenticated/);
 assert.match(sql,/insert into public\.user_roles\(user_id,role\)/);
 assert.match(sql,/delete from public\.user_roles/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/revoke all on function public\.rubi_manage_master_access/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(sql,/security definer/);
 assert.match(sql,/Target user must already exist/);
});
test("server and interface restrict delegation to founding Master",()=>{
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/p_actor:context\.userId/);
 assert.match(server,/rubi_manage_master_access/);
 assert.match(server,/isFoundingMaster:context\.userId===primary/);
 assert.match(panel,/query\.data\?\.isFoundingMaster/);
 assert.match(panel,/window\.confirm/);
 assert.match(panel,/Revogar acesso/);
 assert.match(source("../routes/admin/settings.tsx"),/RubiAuthorizedMastersAdmin/);
});
