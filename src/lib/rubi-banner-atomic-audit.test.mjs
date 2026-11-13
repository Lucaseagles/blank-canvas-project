import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const sql=source("../../supabase/migrations/20261113120000_rubi_banner_atomic_audit.sql");
const settings=source("./admin-settings.functions.ts");
test("banner create and delete use one transaction with audit",()=>{
 assert.match(sql,/create or replace function public\.rubi_create_banner_audited/);
 assert.match(sql,/create or replace function public\.rubi_delete_banner_audited/);
 assert.match(sql,/insert into public\.banners/);
 assert.match(sql,/delete from public\.banners/);
 assert.match(sql,/insert into public\.admin_audit_log/g);
 assert.match(sql,/RUBI_BANNER_CREATED/);
 assert.match(sql,/RUBI_BANNER_DELETED/);
 assert.match(sql,/for update/);
 assert.match(sql,/r\.user_id=p_actor and r\.role='owner'/);
});
test("RPC is private and server actor comes from authenticated middleware",()=>{
 assert.match(sql,/revoke all on function public\.rubi_create_banner_audited/);
 assert.match(sql,/revoke all on function public\.rubi_delete_banner_audited/);
 assert.match(sql,/to service_role/g);
 assert.doesNotMatch(sql,/security definer/);
 assert.match(settings,/requireOwnerRole/g);
 assert.match(settings,/rpc\("rubi_create_banner_audited"/);
 assert.match(settings,/rpc\("rubi_delete_banner_audited"/);
 assert.match(settings,/p_actor:context\.userId/g);
});
test("audit never records banner URLs or private editorial text",()=>{
 const after=sql.slice(sql.indexOf("insert into public.admin_audit_log"));
 assert.doesNotMatch(after,/new_banner\.image_url|new_banner\.link_url|old_banner\.link_url|old_banner\.image_url/);
 assert.match(after,/target_device/);
});
