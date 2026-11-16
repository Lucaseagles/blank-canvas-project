import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseRubiAffiliateCsv,safeRubiAffiliateUrl} from "./rubi-affiliate-csv-parser.ts";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("CSV parsing handles quoted lines, BOM and malformed quotes",()=>{
 const csv='\uFEFFname,description,price,affiliate_url,marketplace\r\n"Item, A","Description ""quoted""",10.20,https://shop.example/item,Shopee\r\n';
 const {headers,rows}=parseRubiAffiliateCsv(csv);
 assert.equal(headers[0],"name");
 assert.deepEqual(rows[0]?.slice(0,3),["Item, A",'Description "quoted"',"10.20"]);
 assert.throws(()=>parseRubiAffiliateCsv('a,b\n"x,y'),/aspas/);
 assert.throws(()=>parseRubiAffiliateCsv('a,a\n1,2'),/repetidas/);
});
test("CSV affiliate URL validation rejects local, http and credential-bearing links",()=>{
 assert.equal(safeRubiAffiliateUrl("https://s.click.aliexpress.com/e/xyz"),true);
 assert.equal(safeRubiAffiliateUrl("https://mercadolivre.com.br/item?a=b"),true);
 for(const url of ["http://shopee.com/item","https://localhost/a","https://127.0.0.1/a","https://foo.internal/a","https://user:pass@shopee.com/a","javascript:alert(1)","https://[::1]/a"])
  assert.equal(safeRubiAffiliateUrl(url),false,url);
});
test("CSV import calls Owner-only audited RPC, never browser product insert or immediate publication",()=>{
 const source=read("./rubi-affiliate-product-import.functions.ts");
 const view=read("../admin/products/ProductImport.tsx");
 const client=read("./supabase/importExport.ts");
 const sql=read("../../supabase/migrations/20261115200000_rubi_affiliate_csv_draft_atomic_audit.sql");
 assert.match(source,/requireOwnerRole/);
 assert.match(source,/rows\.length>100/);
 assert.match(source,/errors\.length\)return \{success:false,imported:0,errors\}/);
 assert.match(source,/rpc\("rubi_import_affiliate_drafts_audited"/);
 assert.match(source,/p_actor:context\.userId/);
 assert.match(view,/useServerFn\(importAffiliateProductCsvAdmin\)/);
 assert.doesNotMatch(client,/importProductsFromCSV|\.from\("products"\)\.insert/);
 assert.match(sql,/security invoker set search_path=''/);
 assert.match(sql,/r\.role='owner'/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/Product already exists for this affiliate link/);
 assert.match(sql,/insert into public\.products/);
 assert.match(sql,/'draft',v_url/);
 assert.match(sql,/insert into public\.admin_audit_log/);
 assert.match(sql,/revoke all on function[\s\S]*from public,anon,authenticated/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(sql,/security definer/);
});
