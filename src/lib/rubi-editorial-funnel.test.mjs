import test from "node:test";
import assert from "node:assert/strict";
import {validEditorialContext} from "./rubi-editorial-context.ts";
import {readFileSync} from "node:fs";
const root=(p)=>readFileSync(new URL(p,import.meta.url),"utf8");
const section="00000000-0000-4000-8000-000000000011";
const product="00000000-0000-4000-8000-000000000012";
test("Editorial context must match SKU and expire after 30 minutes",()=>{
 const now=200000000;
 const valid={sectionId:section,productId:product,timestamp:now-1000};
 assert.equal(validEditorialContext(valid,product,now),section);
 assert.equal(validEditorialContext({...valid,productId:section},product,now),null);
 assert.equal(validEditorialContext({...valid,timestamp:now-31*60000},product,now),null);
 assert.equal(validEditorialContext({...valid,timestamp:now+1000},product,now),null);
 assert.equal(validEditorialContext({...valid,sectionId:"not-an-id"},product,now),null);
});
test("Click to product view to supplier exit preserves editorial label without partner substitution",()=>{
 const c=root("../components/store/RubiStorefrontSections.tsx");
 const d=root("../routes/hub-product.$productId.tsx");
 const p=root("../components/store/RubiPreCheckout.tsx");
 assert.match(c,/rememberRubiEditorialClick\(section\.id,p\.id\)/);
 assert.match(d,/editorial_section_id: getRubiEditorialSection\(product\.id\)/);
 assert.match(p,/editorial_section_id: origin === "store" \? getRubiEditorialSection\(product\.id\) : null/);
 assert.match(p,/has_partner_referral/);
});
test("RPC offers aggregated stages only to the service role",()=>{
 const sql=root("../../supabase/migrations/20261111140000_rubi_editorial_funnel_summary.sql");
 assert.match(sql,/grant execute on function public\.rubi_editorial_funnel_summary\(integer\) to service_role/i);
 assert.match(sql,/revoke all on function public\.rubi_editorial_funnel_summary\(integer\) from public,anon,authenticated/i);
 assert.match(sql,/RUBI_PRECHECKOUT_CONTINUE/);
 assert.match(sql,/RUBI_STORE_PRODUCT_VIEW/);
 assert.match(sql,/RUBI_STOREFRONT_SECTION_CLICK/);
 const fn=root("./rubi-editorial-metrics.functions.ts");
 assert.match(fn,/requireOwnerRole/);
 assert.match(fn,/rubi_editorial_funnel_summary/);
});
