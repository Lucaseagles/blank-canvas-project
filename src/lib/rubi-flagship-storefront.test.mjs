import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=(name)=>readFileSync(new URL(name,import.meta.url),"utf8");
test("Flagship store keeps only official retail catalog and product route",()=>{
 const code=source("../routes/hub-shop.tsx");
 assert.match(code,/getRetailHubCatalog/);
 assert.match(code,/to="\/hub-product\/\$productId"/);
 assert.match(code,/to="\/wholesale"/);
 assert.match(code,/to="\/partner\/portal"/);
 assert.match(code,/to="\/videos"/);
 assert.doesNotMatch(code,/supplier_cost|checkout_url\s*=/);
});
test("Product details keep the existing official precheckout and approved campaign page",()=>{
 const code=source("../routes/hub-product.$productId.tsx");
 assert.match(code,/<RubiMovementLanding productId=\{product.id\}/);
 assert.match(code,/<RubiPreCheckout product=\{product\}/);
 assert.match(code,/id="rubi-purchase"/);
 assert.match(code,/retail_price/);
});
test("Retail entry exists in consumer, merchant, partner and video discovery flows",()=>{
 for(const route of ["../routes/feed.tsx","../routes/wholesale.tsx","../routes/partner/portal.tsx"]){
  assert.match(source(route),/<RubiStorefrontEntry audience=/);
 }
 assert.match(source("../routes/videos.tsx"),/to="\/hub-shop"/);
});
test("Audience entry never presents wholesale prices or partner commission links in retail store",()=>{
 const entry=source("../components/store/RubiStorefrontEntry.tsx");
 assert.match(entry,/Para divulgar com atribuição e comissão, utilize seus links autorizados/);
 assert.match(entry,/preços de atacado continuam exclusivos/);
 assert.doesNotMatch(entry,/checkout_url|b2b_base_price/);
});
