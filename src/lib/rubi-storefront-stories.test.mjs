import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
test("Story discovery is restricted to approved rights and active validated products",()=>{
 const source=read("./rubi-storefront-stories.functions.ts");
 assert.match(source,/\.eq\("status","approved"\)/);
 assert.match(source,/\.eq\("rights_confirmed",true\)/);
 assert.match(source,/\.eq\("active",true\)/);
 assert.match(source,/approvedRubiCheckout\(p\)/);
 assert.match(source,/validRubiStoryMediaUrl/);
 assert.doesNotMatch(source,/supplier_cost|evidence_notes|checkout_url,retail_price/);
});
test("Homepage only uses validated public Stories and preserves catalog links",()=>{
 const shop=read("../routes/hub-shop.tsx");
 const story=read("../components/store/RubiStorefrontStories.tsx");
 assert.match(shop,/<RubiStorefrontStories\s*\/>/);
 assert.match(shop,/getRetailHubCatalog/);
 assert.match(story,/getRubiStorefrontStories/);
 assert.match(story,/to="\/hub-product\/\$productId"/);
 assert.match(story,/preload="none"/);
});
test("Empty editorial inventory never displays fictional Story placeholders",()=>{
 const story=read("../components/store/RubiStorefrontStories.tsx");
 assert.match(story,/if\(!query\.data\?\.length\)return null/);
});
