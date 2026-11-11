import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {activeRubiStorefrontSection,validRubiStorefrontWindow,emptyRubiStorefrontSection} from "./rubi-storefront-sections.ts";
const sample={...emptyRubiStorefrontSection(),title:"Lançamentos em destaque",product_ids:["p"],status:"published"};
test("Drafts and timed sections remain hidden outside the approved window",()=>{
 const now=new Date("2026-11-11T12:00:00.000Z");
 assert.equal(activeRubiStorefrontSection({...sample,status:"draft"},now),false);
 assert.equal(activeRubiStorefrontSection({...sample,starts_at:"2026-11-12T00:00:00Z"},now),false);
 assert.equal(activeRubiStorefrontSection({...sample,ends_at:"2026-11-11T11:00:00Z"},now),false);
 assert.equal(activeRubiStorefrontSection(sample,now),true);
 assert.equal(validRubiStorefrontWindow({...sample,starts_at:"2026-11-12T00:00:00Z",ends_at:"2026-11-11T00:00:00Z"}),false);
});
test("Only validated retail products are rendered; no private checkout data",()=>{
 const source=readFileSync(new URL("./rubi-storefront-sections.functions.ts",import.meta.url),"utf8");
 assert.match(source,/requireOwnerRole/);
 assert.match(source,/approvedRubiCheckout\(p\)/);
 assert.match(source,/activeRubiStorefrontSection\(s,now\)/);
 assert.match(source,/status","published"/);
 assert.doesNotMatch(source,/supplier_cost/);
});
test("Shop and Master embed editorial sections",()=>{
 const shop=readFileSync(new URL("../routes/hub-shop.tsx",import.meta.url),"utf8");
 const admin=readFileSync(new URL("../routes/admin/hub-catalog.tsx",import.meta.url),"utf8");
 assert.match(shop,/<RubiStorefrontSections\s*\/>/);
 assert.match(admin,/<RubiStorefrontSectionsAdmin products=\{products\}/);
});
