import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const sql=read("../../supabase/migrations/20261113110000_rubi_supplier_b2b_atomic_audit.sql");
const server=read("./hub-catalog.functions.ts");
const ui=read("../routes/admin/hub-catalog.tsx");
test("supplier checkout host edit and audit commit together",()=>{
 assert.match(sql,/rubi_save_supplier_audited/);
 assert.match(sql,/insert into public\.hub_suppliers/);
 assert.match(sql,/update public\.hub_suppliers/);
 assert.match(sql,/insert into public\.admin_audit_log/g);
 assert.match(sql,/old_supplier\.revision is distinct from p_revision/);
 assert.match(sql,/Unpublish and unverify associated products/);
 assert.match(sql,/for update/);
 assert.match(sql,/role='owner'/);
});
test("B2B tier price edit uses product lock and audit in one transaction",()=>{
 assert.match(sql,/rubi_save_b2b_tier_audited/);
 assert.match(sql,/insert into public\.hub_b2b_tiers/);
 assert.match(sql,/update public\.hub_b2b_tiers/);
 assert.match(sql,/current_product\.min_b2b_quantity/);
 assert.match(sql,/where p\.id=p_product_id for update/);
 assert.match(sql,/RUBI_B2B_TIER_UPDATED/);
 assert.match(sql,/RUBI_B2B_TIER_CREATED/);
});
test("backend binds actor to session and public roles cannot invoke RPC",()=>{
 assert.match(server,/requireOwnerRole/g);
 assert.match(server,/rpc\("rubi_save_supplier_audited"/);
 assert.match(server,/rpc\("rubi_save_b2b_tier_audited"/);
 assert.match(server,/p_actor:context\.userId/g);
 assert.match(server,/requiresSupplierCheckoutReverification/);
 assert.match(server,/normalizeRubiCheckoutHost/);
 assert.match(sql,/revoke all on function public\.rubi_save_supplier_audited/);
 assert.match(sql,/revoke all on function public\.rubi_save_b2b_tier_audited/);
 assert.match(sql,/to service_role/g);
 assert.doesNotMatch(sql,/security definer/);
});
test("supplier edit takes concurrency revision and audit does not store host",()=>{
 assert.match(ui,/revision: supplier\.revision/);
 assert.match(ui,/revision: supplierRevision \?\? undefined/);
 const audit=sql.slice(sql.indexOf("insert into public.admin_audit_log("));
 assert.doesNotMatch(audit,/jsonb_build_object\([^;]*'checkout_host'/);
});
