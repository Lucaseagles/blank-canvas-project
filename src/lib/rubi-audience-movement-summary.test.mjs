import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {summarizeRubiAudienceMovements} from "./rubi-audience-movement-summary.ts";
const product="00000000-0000-4000-8000-000000000001";
const movements=[{id:"m1",name:"Consumidor",audience:"consumer"},{id:"m2",name:"Lojista",audience:"merchant"}];
const variants=[{id:"v1",movement_id:"m1"},{id:"v2",movement_id:"m2"}];
const plans=[{id:"p1",variant_id:"v1",channel:"instagram",campaign:"unique1"},
 {id:"p2",variant_id:"v2",channel:"tiktok",campaign:"unique2"}];
const traffic=[{productId:product,channel:"instagram",campaign:"unique1",viewEvents:20,viewSessions:12,checkoutIntents:4},
 {productId:product,channel:"tiktok",campaign:"unique2",viewEvents:10,viewSessions:7,checkoutIntents:1}];
test("different movements and editorial audiences keep their own observations",()=>{
 const result=summarizeRubiAudienceMovements(movements,variants,plans,traffic,product,false);
 assert.equal(result[0].audience,"consumer");
 assert.equal(result[0].intentPerViewPercent,20);
 assert.equal(result[1].audience,"merchant");
 assert.equal(result[1].intentPerViewPercent,10);
});
test("same SKU ambiguous labels across movements are excluded",()=>{
 const duplicate=[...plans,{id:"p3",variant_id:"v2",channel:"instagram",campaign:"unique1"}];
 const result=summarizeRubiAudienceMovements(movements,variants,duplicate,traffic,product,false);
 assert.equal(result[0].ambiguousCampaigns,1);
 assert.equal(result[0].viewEvents,0);
 assert.equal(result[0].intentPerViewPercent,null);
 assert.equal(result[1].ambiguousCampaigns,1);
});
test("missing, partial and implausible event data never creates reliable rates",()=>{
 assert.equal(summarizeRubiAudienceMovements(movements,variants,plans,traffic,product,true)[0].intentPerViewPercent,null);
 assert.equal(summarizeRubiAudienceMovements(movements,variants,plans,[],product,false)[0].intentPerViewPercent,null);
 const wrong=[{...traffic[0],checkoutIntents:25}];
 assert.equal(summarizeRubiAudienceMovements(movements,variants,plans,wrong,product,false)[0].intentPerViewPercent,null);
 const other=[{...traffic[0],productId:"other"}];
 assert.equal(summarizeRubiAudienceMovements(movements,variants,plans,other,product,false)[0].viewEvents,0);
});
test("server and panel keep owner gate, query bounds, and honest disclaimers",()=>{
 const server=readFileSync(new URL("./rubi-audience-movement-summary.functions.ts",import.meta.url),"utf8");
 const panel=readFileSync(new URL("../components/store/RubiAudienceMovementSummaryAdmin.tsx",import.meta.url),"utf8");
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/limit\(101\)/);
 assert.match(server,/limit\(501\)/);
 assert.match(server,/limit\(1001\)/);
 assert.match(server,/p_limit:200/);
 assert.match(panel,/não um perfil comprovado/);
 assert.match(panel,/Cobertura incompleta/);
 assert.doesNotMatch(server,/createCheckout|payCommission|confirmPaidOrder/);
});
