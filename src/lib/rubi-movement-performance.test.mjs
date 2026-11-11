import test from "node:test";
import assert from "node:assert/strict";
import {correlateMovementTraffic,percentOfIntentToView} from "./rubi-movement-performance.ts";
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
