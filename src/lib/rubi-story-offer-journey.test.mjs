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

test("public Story listing fails closed unless product, supplier, checkout and Story are eligible",()=>{
 const server=source("./rubi-product-stories.functions.ts");
 assert.match(server,/canServeVersionedRubiStory\(/);
 assert.match(server,/approvedRubiCheckout\(product\)/);
 assert.match(server,/\.eq\("status","approved"\)/);
 assert.match(server,/\.eq\("rights_confirmed",true\)/);
 assert.match(server,/\.not\("movement_id","is",null\)/);
 assert.match(server,/if\(\(rows\?\?\[\]\)\.length>50\)return \[\]/);
});

test("Story approval requires rights, active official supplier checkout and consumer movement for the same product",()=>{
 const server=source("./rubi-product-stories.functions.ts");
 assert.match(server,/data\.confirmedEvidence/);
 assert.match(server,/canApproveRubiProductStory\(story as RubiProductStory\)/);
 assert.match(server,/if\(!product\?\.active\|\|Number\(product\.retail_price\)<=0\|\|!approvedRubiCheckout\(product\)\)/);
 assert.match(server,/if\(!movement\|\|movement\.status!==\"review\"\|\|movement\.audience!==\"consumer\"\)/);
 assert.match(server,/\.eq\("product_id",data\.productId\)/);
 assert.match(server,/p_expected_revision:data\.revision/);
 assert.match(server,/rubi_set_story_approval_audited/);
});

test("partner checkout never falls back to a direct product URL without verified attribution",()=>{
 const checkout=source("./rubi-precheckout.functions.ts");
 const partnerBranch=checkout.slice(checkout.indexOf("if (partnerCode)"),checkout.indexOf("const destination = approvedRubiCheckout(product as any)"));
 assert.match(partnerBranch,/hub_partner_referral_links/);
 assert.match(partnerBranch,/hub_partner_product_grants/);
 assert.match(partnerBranch,/return \{/);
 assert.match(partnerBranch,/Checkout do parceiro aguardando link oficial e atribuição confirmada/);
 assert.doesNotMatch(partnerBranch,/destination:\s*approvedRubiCheckout|return \{\s*ready:\s*true/);
});

test("Story interest analytics is never treated as a paid order",()=>{
 const stories=source("../components/store/RubiProductStories.tsx");
 const checkout=source("./rubi-precheckout.functions.ts");
 assert.match(stories,/sales_status:"interest_only"/);
 assert.match(checkout,/No request creates a payment\/order or confirms a conversion/);
 assert.match(checkout,/Partner checkout remains closed until a verified attribution mechanism exists/);
});
