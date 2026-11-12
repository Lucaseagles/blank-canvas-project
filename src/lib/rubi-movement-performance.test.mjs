import test from "node:test";
import assert from "node:assert/strict";
import {correlateMovementTraffic,percentOfIntentToView,summarizeMovementVariants,assessRubiVariantDecisionReadiness} from "./rubi-movement-performance.ts";
const product="00000000-0000-4000-8000-000000000001";
test("never converts absence of traffic into a success rate",()=>{
 assert.equal(percentOfIntentToView(0,0),null);
 assert.equal(percentOfIntentToView(5,20),25);
 assert.equal(percentOfIntentToView(1,3),33.3);
});
test("matches only correct product, channel and campaign",()=>{
 const plans=[{id:"p1",variant_id:"v1",channel:"instagram",campaign:"a",status:"planned"}];
 const traffic=[
  {productId:"other",channel:"instagram",campaign:"a",viewEvents:999,viewSessions:500,checkoutIntents:50},
  {productId:product,channel:"tiktok",campaign:"a",viewEvents:999,viewSessions:500,checkoutIntents:50},
  {productId:product,channel:"instagram",campaign:"a",viewEvents:10,viewSessions:8,checkoutIntents:2}
 ];
 const row=correlateMovementTraffic(product,plans,traffic)[0];
 assert.equal(row?.viewEvents,10);assert.equal(row?.checkoutIntents,2);assert.equal(row?.intentPerViewPercent,20);
});
test("campaign duplicates do not claim variant attribution",()=>{
 const plans=[
  {id:"p1",variant_id:"v1",channel:"instagram",campaign:"same",status:"planned"},
  {id:"p2",variant_id:"v2",channel:"instagram",campaign:"same",status:"planned"}
 ];
 const rows=correlateMovementTraffic(product,plans,[{productId:product,channel:"instagram",campaign:"same",viewEvents:100,viewSessions:50,checkoutIntents:10}]);
 assert.equal(rows[0]?.ambiguousAttribution,true);
 assert.equal(rows[1]?.intentPerViewPercent,null);
});

test("variant summaries exclude ambiguous and unobserved campaigns from totals",()=>{
 const plans=[
  {id:"p1",variant_id:"v1",channel:"instagram",campaign:"unique",status:"manually_published"},
  {id:"p2",variant_id:"v1",channel:"tiktok",campaign:"missing",status:"planned"},
  {id:"p3",variant_id:"v1",channel:"instagram",campaign:"shared",status:"planned"},
  {id:"p4",variant_id:"v2",channel:"instagram",campaign:"shared",status:"planned"},
  {id:"p5",variant_id:"v2",channel:"tiktok",campaign:"second",status:"manually_published"}
 ];
 const traffic=[
  {productId:product,channel:"instagram",campaign:"unique",viewEvents:20,viewSessions:15,checkoutIntents:4},
  {productId:product,channel:"instagram",campaign:"shared",viewEvents:100,viewSessions:50,checkoutIntents:40},
  {productId:product,channel:"tiktok",campaign:"second",viewEvents:10,viewSessions:8,checkoutIntents:2}
 ];
 const result=summarizeMovementVariants(correlateMovementTraffic(product,plans,traffic));
 const first=result.find(row=>row.variantId==="v1");
 const second=result.find(row=>row.variantId==="v2");
 assert.equal(first?.observedCampaigns,1);
 assert.equal(first?.unobservedCampaigns,1);
 assert.equal(first?.ambiguousCampaigns,1);
 assert.equal(first?.viewEvents,20);
 assert.equal(first?.checkoutIntents,4);
 assert.equal(first?.intentPerViewPercent,20);
 assert.equal(second?.viewEvents,10);
 assert.equal(second?.ambiguousCampaigns,1);
 assert.equal(second?.intentPerViewPercent,20);
});
test("variant with no trustworthy observations has no conversion ratio",()=>{
 const result=summarizeMovementVariants(correlateMovementTraffic(product,
  [{id:"p0",variant_id:"v3",channel:"instagram",campaign:"absent",status:"planned"}],[]));
 assert.equal(result[0]?.unobservedCampaigns,1);
 assert.equal(result[0]?.intentPerViewPercent,null);
});

test("decision support never declares A/B winner from observational or partial traffic",()=>{
 const summaries=[
 {variantId:"v0",observedCampaigns:0,ambiguousCampaigns:0,unobservedCampaigns:1,viewEvents:0,checkoutIntents:0,intentPerViewPercent:null},
 {variantId:"v1",observedCampaigns:1,ambiguousCampaigns:0,unobservedCampaigns:0,viewEvents:50,checkoutIntents:5,intentPerViewPercent:10},
 {variantId:"v2",observedCampaigns:1,ambiguousCampaigns:1,unobservedCampaigns:0,viewEvents:100,checkoutIntents:20,intentPerViewPercent:20}
 ];
 const complete=assessRubiVariantDecisionReadiness(summaries,false);
 assert.deepEqual(complete.map(x=>x.status),["no_observations","observational_only","incomplete_attribution"]);
 assert.match(complete[1].reason,/não há vencedor A\/B/);
 const partial=assessRubiVariantDecisionReadiness(summaries,true);
 assert.equal(partial[1].status,"incomplete_attribution");
 assert.equal(partial[0].intentPerViewPercent,null);
});
