import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
test("Only approved licensed stories are paired with eligible retail products",()=>{
 const source=read("./rubi-storefront-sections.functions.ts");
 assert.match(source,/approvedRubiCheckout\(p\)/);
 assert.match(source,/\.eq\("status","approved"\)/);
 assert.match(source,/\.eq\("rights_confirmed",true\)/);
 assert.match(source,/validRubiStoryMediaUrl/);
 assert.doesNotMatch(source,/supplier_cost|evidence_notes/);
});
test("Editorial cards link to canonical product rather than supplier checkout",()=>{
 const component=read("../components/store/RubiStorefrontSections.tsx");
 assert.match(component,/p\.story&&/);
 assert.match(component,/to="\/hub-product\/\$productId"/);
 assert.doesNotMatch(component,/checkout_url|supplier_cost/);
});
