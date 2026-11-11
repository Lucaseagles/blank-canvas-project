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

test("Authorized checkout remains reachable when analytics fails, with a visible retry error",()=>{
 const code=source("../components/store/RubiPreCheckout.tsx");
 assert.match(code,/const latest = await getReadiness/);
 assert.match(code,/if \(!latest\.ready\)/);
 assert.match(code,/try \{\s*await trackEvent\("RUBI_PRECHECKOUT_CONTINUE"/);
 assert.match(code,/A telemetry outage must never prevent a freshly authorized purchase/);
 assert.match(code,/window\.location\.assign\(url\.toString\(\)\)/);
 assert.match(code,/checkoutError && <p role="alert"/);
});

test("Unavailable partner referrals show a safe fallback without checkout",()=>{
 const route=source("../routes/r/$code.tsx");
 assert.match(route,/!query\.isLoading && !query\.isError && !product/);
 assert.match(route,/Indicação indisponível/);
 assert.match(route,/href="\/hub-shop"/);
 assert.match(route,/\{product && \(/);
 assert.match(route,/partnerCode=\{code\}/);
});

test("Consumer feed discovers only published movement pages with current approvals",()=>{
 const feed=source("../routes/feed.tsx");
 const shelf=source("../components/store/RubiApprovedMovementShelf.tsx");
 const server=source("./rubi-movement-feed.functions.ts");
 assert.match(feed,/<RubiApprovedMovementShelf \/>/);
 assert.match(shelf,/getRubiApprovedMovementFeed/);
 assert.match(shelf,/Seleção editorial/);
 assert.match(server,/\.not\("page_published_at", "is", null\)/);
 assert.match(server,/canServeApprovedMovementPage\(/);
 assert.match(server,/approvedRubiCheckout\(product\)/);
 assert.match(server,/movement\.product_id===product\.id/);
 assert.match(server,/rubiOrganicProductPath\(/);
 assert.doesNotMatch(server,/user_interests|user_metadata|user_id|supplier_cost/);
 assert.doesNotMatch(shelf,/checkout_url|supplier_cost|comissão confirmada/);
});
