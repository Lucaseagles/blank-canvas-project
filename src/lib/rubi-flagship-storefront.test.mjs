import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=(name)=>readFileSync(new URL(name,import.meta.url),"utf8");
test("Flagship store keeps only official retail catalog and product route",()=>{
 const code=source("../routes/hub-shop.tsx");
 assert.match(code,/getRetailHubCatalog/);
 assert.ok(code.includes('const link="/hub-product/$productId"'));
 assert.ok(code.includes('to={link}'));
 assert.ok(code.includes('to="/wholesale"'));
 assert.ok(code.includes('to="/partner/portal"'));
 assert.ok(code.includes('to="/videos"'));
 assert.doesNotMatch(code,/supplier_cost|checkout_url\s*=/);
});
test("Product details keep existing official precheckout and approved campaign page",()=>{
 const code=source("../routes/hub-product.$productId.tsx");
 assert.ok(code.includes('<RubiMovementLanding productId={product.id} />'));
 assert.ok(code.includes('<RubiPreCheckout product={product}'));
 assert.ok(code.includes('id="rubi-purchase"'));
 assert.match(code,/retail_price/);
});
test("Retail entry exists in consumer, merchant, partner and video flows",()=>{
 for(const route of ["../routes/feed.tsx","../routes/wholesale.tsx","../routes/partner/portal.tsx"]){
  assert.match(source(route),/<RubiStorefrontEntry audience=/);
 }
 assert.ok(source("../routes/videos.tsx").includes('to="/hub-shop"'));
});
test("Audience entry never discloses wholesale or partner transactions in retail store",()=>{
 const entry=source("../components/store/RubiStorefrontEntry.tsx");
 assert.match(entry,/links autorizados no portal/);
 assert.match(entry,/preços de atacado continuam exclusivos/);
 assert.doesNotMatch(entry,/checkout_url|b2b_base_price/);
});
