import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {rankRubiAudienceCatalog} from "./rubi-audience-catalog-ranking.ts";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const p=[
 {id:"1",category:"Casa",min_b2b_quantity:10},
 {id:"2",category:"Beleza",min_b2b_quantity:5},
 {id:"3",category:"Eletrônicos",min_b2b_quantity:5},
 {id:"4",category:"Moda e acessórios",min_b2b_quantity:5},
 {id:"5",category:"Beleza",min_b2b_quantity:8},
 {id:"6",category:"Beleza",min_b2b_quantity:12},
 {id:"7",category:"Cosméticos",min_b2b_quantity:5},
 {id:"8",category:"Casa",min_b2b_quantity:3}
];
test("merchant quiz matches segment and feasible batch without removing any eligible SKU",()=>{
 const ranked=rankRubiAudienceCatalog(p,"merchant",{merchant_segment:"beauty",batch_size:"5_9"});
 assert.deepEqual(ranked.filter(x=>x.suggestedForAudience).map(x=>x.id),["2","5","7"]);
 assert.equal(ranked[3]?.suggestedForAudience,false);
 assert.deepEqual([...ranked.map(x=>x.id)].sort(),p.map(x=>x.id).sort());
 assert.equal(ranked.length,p.length);
 assert.equal(ranked.find(x=>x.id==="6")?.suggestedForAudience,false);
});
test("partner niche matches approved product category, not follower count or purchase history",()=>{
 const ranked=rankRubiAudienceCatalog(p,"partner",{niche:"beleza e cosméticos"});
 assert.ok(ranked.find(x=>x.id==="2")?.suggestedForAudience);
 assert.ok(ranked.find(x=>x.id==="7")?.suggestedForAudience);
 assert.equal(ranked.find(x=>x.id==="1")?.suggestedForAudience,false);
 for(const quiz of [null,{niche:""},{niche:"marketing digital"}]){
  assert.deepEqual(rankRubiAudienceCatalog(p,"partner",quiz).map(x=>x.id),p.map(x=>x.id));
 }
});
test("catalog authorization is applied before matching, no leakage or unapproved checkout",()=>{
 const b2b=read("./hub-catalog.functions.ts");
 const partner=read("./partner-portal.functions.ts");
 const merchantUi=read("../routes/wholesale.tsx");
 const partnerUi=read("../routes/partner/portal.tsx");
 assert.match(b2b,/getMerchantHubCatalog[\s\S]*?supabaseAdmin\.auth\.getUser\(data\.accessToken\)/);
 assert.match(b2b,/\.eq\("audience","merchant"\)\.eq\("status","approved"\)/);
 assert.match(b2b,/rankRubiAudienceCatalog\(eligible,"merchant",profile\.qualification_answers\)/);
 assert.match(partner,/supabaseAdmin\.auth\.getUser\(input\.accessToken\)/);
 assert.match(partner,/profile\.status !== "approved"/);
 assert.match(partner,/\.eq\("commercial_profile_id", profile\.id\)/);
 assert.match(partner,/approvedRubiCheckout\(product\)/);
 assert.match(partner,/rankRubiAudienceCatalog\(eligible,"partner",quiz\)/);
 assert.match(partner,/qualification_answers: quiz, \.\.\.safeProfile/);
 assert.match(merchantUi,/Sugestão por segmento e quantidade/);
 assert.match(partnerUi,/Categoria relacionada ao nicho/);
});
