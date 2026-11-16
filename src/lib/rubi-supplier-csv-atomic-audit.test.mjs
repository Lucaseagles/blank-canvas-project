import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseRubiSupplierCsv,RUBI_CSV_TEMPLATE} from "./rubi-supplier-csv.ts";
const read=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");

test("supplier CSV batch saves only inactive, unverified drafts with Owner-audited RPC",()=>{
 const server=read("./rubi-supplier-csv.functions.ts");
 const sql=read("../../supabase/migrations/20261115220000_rubi_supplier_csv_atomic_audit.sql");
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/parseRubiSupplierCsv\(data\.csv\)/);
 assert.match(server,/rpc\("rubi_import_supplier_drafts_audited"/);
 assert.match(server,/p_actor:context\.userId/);
 assert.match(server,/Number\(created\)!==payload\.length/);
 assert.doesNotMatch(server,/\.from\("hub_products"\)\.insert/);
 assert.match(sql,/security invoker set search_path=''/);
 assert.match(sql,/r\.user_id=p_actor and r\.role='owner'/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/s\.active=true for share/);
 assert.match(sql,/jsonb_array_length\(p_rows\) not between 1 and 50/);
 assert.match(sql,/lower\(btrim\(p\.sku\)\)=lower\(supplier_sku\)/);
 assert.match(sql,/insert into public\.hub_products/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/false,false,null/);
 assert.match(sql,/revoke all on function[\s\S]*from public,anon,authenticated/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(sql,/security definer/i);
 // The Master audit must never copy sensitive supplier cost, checkout host or descriptive copy.
 const audit=sql.slice(sql.indexOf("insert into public.admin_audit_log"),sql.indexOf("inserted:=inserted+1"));
 assert.doesNotMatch(audit,/supplier_cost|retail_price|description_value|image_value|checkout_url/);
});

test("server-import parser disallows duplicate case-insensitive SKU and arbitrary fields",()=>{
 const valid=parseRubiSupplierCsv(RUBI_CSV_TEMPLATE+"Produto real de fornecedor,,A,SKU-500,49.90,19.90,\n");
 assert.equal(valid.headerErrors.length,0);
 assert.equal(valid.rows[0]?.errors.length,0);
 const duplicated=parseRubiSupplierCsv(RUBI_CSV_TEMPLATE+"Produto A,,,A-1,49.90,19.90,\nProduto B,,,a-1,20.00,9.99,\n");
 assert.match(duplicated.rows[1]?.errors.join(" "),/SKU repetido/i);
 const fake=parseRubiSupplierCsv("title,retail_price,supplier_cost,checkout_verified\nProduto A,49.90,19.90,true\n");
 assert.ok(fake.headerErrors.length>0);
});
