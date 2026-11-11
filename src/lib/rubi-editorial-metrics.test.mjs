import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Editorial cards track their own clicked section and product, never a sale",()=>{
 const c=read("../components/store/RubiStorefrontSections.tsx");
 assert.match(c,/RUBI_STOREFRONT_SECTION_CLICK/);
 assert.match(c,/section_id:section\.id/);
 assert.match(c,/product_id:p\.id/);
 assert.match(c,/sales_status:"view_only"/);
});
test("Analytics report has owner-only access and no visitor identities",()=>{
 const src=read("./rubi-editorial-metrics.functions.ts");
 assert.match(src,/requireOwnerRole/);
 assert.match(src,/rubi_editorial_click_summary/);
 assert.doesNotMatch(src,/anonymous_id|user_id|session_id/);
});
test("SQL aggregation restricts public RPC and includes only existing section/product pairs",()=>{
 const sql=read("../../supabase/migrations/20261111130000_rubi_editorial_click_summary.sql");
 assert.match(sql,/revoke all on function public\.rubi_editorial_click_summary\(integer\) from public,anon,authenticated/i);
 assert.match(sql,/grant execute on function public\.rubi_editorial_click_summary\(integer\) to service_role/i);
 assert.match(sql,/e\.product_id=any\(s\.product_ids\)/);
});
