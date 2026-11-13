import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
test("published Story -> same-product official precheckout is connected",()=>{
 const stories=source("../components/store/RubiProductStories.tsx");
 const product=source("../routes/hub-product.$productId.tsx");
 const checkout=source("./rubi-precheckout.functions.ts");
 assert.match(product,/<RubiProductStories productId=\{product\.id\}/);
 assert.match(product,/id="rubi-purchase"/);
 assert.match(product,/<RubiPreCheckout product=\{product\}/);
 assert.match(stories,/href="#rubi-purchase"/);
 assert.match(stories,/RUBI_STORY_OFFER_INTEREST/);
 assert.match(stories,/sales_status:"interest_only"/);
 assert.match(checkout,/approvedRubiCheckout\(product as any\)/);
 assert.doesNotMatch(stories,/checkout_url|window\.location\.href|confirmPaidOrder/);
});
test("Story failure cannot silently erase the purchase path",()=>{
 const stories=source("../components/store/RubiProductStories.tsx");
 const product=source("../routes/hub-product.$productId.tsx");
 assert.match(stories,/query\.isLoading/);
 assert.match(stories,/query\.isError/);
 assert.match(stories,/query\.refetch\(\)/);
 assert.match(product,/Consultar compra e disponibilidade/);
 assert.match(product,/getRetailHubProduct/);
});
test("public Story listing still requires owner approved version and checkout",()=>{
 const server=source("./rubi-product-stories.functions.ts");
 assert.match(server,/canServeVersionedRubiStory\(/);
 assert.match(server,/approvedRubiCheckout\(product\)/);
 assert.match(server,/\.eq\("status","approved"\)/);
 assert.match(server,/\.eq\("rights_confirmed",true\)/);
});
