import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const sql=load("../../supabase/migrations/20261113100000_rubi_hub_product_atomic_audit.sql");
const server=load("./hub-catalog.functions.ts");
const ui=load("../routes/admin/hub-catalog.tsx");
test("product, price and checkout edits share transaction with Master audit",()=>{
 assert.match(sql,/create or replace function public\.rubi_save_hub_product_audited/);
 assert.match(sql,/insert into public\.hub_products/);
 assert.match(sql,/update public\.hub_products/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/for update/);
 assert.match(sql,/revision is distinct from p_expected_revision/);
 assert.match(sql,/RUBI_PRODUCT_CREATED/);
 assert.match(sql,/RUBI_PRODUCT_UPDATED/);
 assert.match(sql,/r\.user_id=p_actor and r\.role='owner'/);
 assert.doesNotMatch(sql,/security definer/);
});
test("private RPC permissions and checkout host remain strict",()=>{
 assert.match(sql,/revoke all on function public\.rubi_save_hub_product_audited/);
 assert.match(sql,/to service_role/);
 assert.match(sql,/Verified checkout must match active supplier HTTPS host/);
 assert.match(sql,/Unpublish commercial changes before saving/);
 assert.match(sql,/Reverify checkout after commercial changes/);
 assert.match(server,/approvedRubiCheckout|verifyRubiCheckoutUrl/);
 assert.match(server,/requiresSupplierCheckoutReverification/);
});
test("editor uses revision guard with actor from authenticated server middleware",()=>{
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/p_actor:context\.userId/);
 assert.match(server,/rpc\("rubi_save_hub_product_audited"/);
 assert.match(server,/p_expected_revision:revision\?\?null/);
 assert.match(ui,/revision: product\.revision/);
 assert.match(ui,/revision: form\.revision/);
 assert.doesNotMatch(server,/\.from\("hub_products"\)\.upsert/);
});
test("audit does not include checkout URL or descriptive private text",()=>{
 const audit=sql.slice(sql.indexOf("insert into public.admin_audit_log"));
 assert.doesNotMatch(audit,/p_values->>'checkout_url'|old_product\.checkout_url|p_values->>'description'|p_values->>'image_url'/);
 assert.match(audit,/new_snapshot/);
});
