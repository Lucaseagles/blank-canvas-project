import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {quoteRubiAffiliateCommission,rubiAffiliateMilestoneFromConfirmedSales} from "./rubi-affiliate-commission-policy.ts";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("sales milestones are 0, 5, 15, 40 and 100 with 20% ceiling",()=>{
 const cases=[[0,0,5],[4,0,5],[5,2,15],[14,2,15],[15,5,40],[39,5,40],
  [40,10,100],[99,10,100],[100,15,null]] as const;
 for(const [n,bonus,goal] of cases){
  const r=rubiAffiliateMilestoneFromConfirmedSales(n);
  assert.equal(r.bonusPercent,bonus);
  assert.equal(r.nextGoal,goal);
 }
});
test("higher priced goods start lower and never override minimum profit reserve",()=>{
 const small=quoteRubiAffiliateCommission({retailPrice:89,supplierCost:40,additionalCosts:5,confirmedSales:0});
 const middle=quoteRubiAffiliateCommission({retailPrice:148,supplierCost:48,additionalCosts:0,confirmedSales:5});
 const big=quoteRubiAffiliateCommission({retailPrice:600,supplierCost:400,additionalCosts:70,confirmedSales:5});
 assert.equal(small.basePercent,8);
 assert.equal(middle.basePercent,6);
 assert.equal(big.basePercent,5);
 assert.equal(middle.proposedPercent,8);
 assert.equal(big.proposedPercent,7);
 assert.ok(big.recommendedPercent<=7);
 assert.ok(big.recommendedPercent<=big.maximumMarginSafePercent);
 const elite=quoteRubiAffiliateCommission({retailPrice:148,supplierCost:48,additionalCosts:0,confirmedSales:100});
 assert.equal(elite.proposedPercent,20);
 assert.equal(elite.recommendedPercent,20);
 const noMargin=quoteRubiAffiliateCommission({retailPrice:148,supplierCost:140,additionalCosts:12,confirmedSales:100});
 assert.equal(noMargin.eligibleForQuote,false);
 assert.equal(noMargin.recommendedPercent,0);
 assert.throws(()=>rubiAffiliateMilestoneFromConfirmedSales(-1));
});
test("invitation is small, on profile, gated, and never automatically approves partners",()=>{
 const server=read("./rubi-affiliate-invitation.functions.ts");
 const popup=read("../components/profile/RubiAffiliateMiniInvite.tsx");
 const profile=read("../routes/profile.tsx");
 const onboarding=read("../routes/onboarding.tsx");
 assert.match(server,/auth.getUser\(data.accessToken\)/);
 assert.match(server,/score>=60/);
 assert.match(server,/!partner.data/);
 assert.match(server,/\.eq\("user_id",userId\)/);
 assert.match(server,/\.limit\(201\)/);
 assert.match(server,/capped\?0:score/);
 assert.match(popup,/bottom-20 right-3/);
 assert.match(popup,/Não mostrar/);
 assert.match(popup,/30\*86400000/);
 assert.match(popup,/partnerType:"affiliate"/);
 assert.match(profile,/<RubiAffiliateMiniInvite userId=\{userId\}\/>/);
 assert.match(onboarding,/search.partnerType === "affiliate"/);
 assert.doesNotMatch(server,/\.insert\(|\.update\(|\.upsert\(/);
});
test("partner milestone is advisory and never silently changes the financial ledger",()=>{
 const portal=read("../routes/partner/portal.tsx");
 assert.match(portal,/rubiAffiliateMilestoneFromConfirmedSales\(salesQuery.data.sales\)/);
 assert.match(portal,/profile.partner_type==="affiliate"/);
 assert.match(portal,/não alteram automaticamente comissões/);
 assert.doesNotMatch(portal,/\.from\("hub_partner_confirmed_sales"\)\.update/);
});
