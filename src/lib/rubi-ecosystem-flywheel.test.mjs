import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildRubiEcosystemFlywheel,simulateRubiOwnedMargin} from "./rubi-ecosystem-flywheel.ts";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const base={
 totalProducts:0,readyProducts:0,inventoryPartial:false,suppliersWithoutHost:0,
 consumerProfiles:0,storeViews:0,storeCheckoutIntents:0,marketplaceProductViews:0,
 partnerApproved:0,partnerPending:0,partnerActiveLinks:0,partnerVisits:0,partnerSales:0,
 merchantApproved:0,merchantQuotes:0,merchantResponses:0,merchantReplenishments:0
};
test("all 35 RUBI growth strategies feed exactly five connected operational pillars",()=>{
 const cards=buildRubiEcosystemFlywheel(base);
 assert.deepEqual(new Set(cards.map(c=>c.pillar)),new Set(["store","eclipse","achadinhos","partners","business"]));
 assert.equal(cards.reduce((n,c)=>n+c.strategyCount,0),35);
 assert.equal(cards[0]?.pillar,"store");
 assert.equal(cards.find(c=>c.pillar==="store")?.state,"blocked");
 assert.match(cards.find(c=>c.pillar==="store")?.reason??"",/Nenhum SKU real/);
 assert.match(cards.find(c=>c.pillar==="partners")?.nextAction??"",/nano\/micro/);
});
test("inventory and checkout evidence block scaling even if there are views",()=>{
 const plans=buildRubiEcosystemFlywheel({...base,totalProducts:20,
  readyProducts:10,suppliersWithoutHost:1,storeViews:5000,storeCheckoutIntents:200});
 const store=plans.find(p=>p.pillar==="store");
 assert.equal(store?.state,"blocked");
 assert.match(store?.nextAction??"",/checkout oficial/);
});
test("zero conversions cannot be inferred from independent activity counts",()=>{
 const plans=buildRubiEcosystemFlywheel({...base,totalProducts:1,readyProducts:1,storeViews:100,
  partnerApproved:2,partnerActiveLinks:1,partnerVisits:50,merchantApproved:4,merchantQuotes:3});
 const store=plans.find(p=>p.pillar==="store");
 assert.equal(store?.state,"measure");
 assert.match(store?.nextAction??"",/Rever promessa/);
 assert.equal(plans.find(p=>p.pillar==="partners")?.state,"measure");
 assert.match(plans.find(p=>p.pillar==="business")?.reason??"",/não representam compras confirmadas/);
});
test("store economics distinguish entire base from visitors, no invented checkout",()=>{
 const result=simulateRubiOwnedMargin({audience:20000,reachPct:50,visitPct:20,
  purchasePct:15,retailPrice:148,supplierCost:48,otherCost:0});
 assert.deepEqual(result,{reached:10000,visits:2000,orders:300,
  grossRevenue:44400,unitContribution:100,totalContribution:30000,effectiveBaseConversion:1.5});
 const full=simulateRubiOwnedMargin({audience:20000,reachPct:100,visitPct:100,
  purchasePct:15,retailPrice:148,supplierCost:48,otherCost:0});
 assert.equal(full.orders,3000);
 assert.equal(full.totalContribution,300000);
 const costs=simulateRubiOwnedMargin({audience:20000,reachPct:50,visitPct:20,
  purchasePct:15,retailPrice:148,supplierCost:48,otherCost:35});
 assert.equal(costs.totalContribution,19500);
 assert.throws(()=>simulateRubiOwnedMargin({audience:20000,reachPct:101,visitPct:20,
  purchasePct:15,retailPrice:148,supplierCost:48,otherCost:0}));
});
test("flywheel dashboard consumes approved existing data and is Owner-only",()=>{
 const ui=read("../components/admin/RubiEcosystemFlywheelAdmin.tsx");
 const dashboard=read("../routes/admin/dashboard.tsx");
 for(const key of ["getRubiLaunchReadinessAdmin","getRubiCommercialPulseAdmin",
  "getRubiGrowthFunnelAdmin","getRubiThreeFunnelPulseAdmin","buildRubiEcosystemFlywheel","simulateRubiOwnedMargin"]){
  assert.match(ui,new RegExp(key));
 }
 assert.match(dashboard,/<RubiEcosystemFlywheelAdmin \/>/);
 assert.doesNotMatch(ui,/\.insert\(|\.upsert\(|\.update\(/);
 assert.match(ui,/não representa lucro líquido/);
});
