import test from "node:test";
import assert from "node:assert/strict";
import {assessRubiLaunch} from "./rubi-launch-readiness.ts";
const editorial={playbooks:0,approvedPlaybooks:0,movements:0,variants:0,approvedPages:0};
const product={id:"p",title:"Produto",active:false,retail_price:100,supplier_cost:70,description:null,image_url:null,
 checkout_url:null,checkout_verified:false,hub_suppliers:{active:true,checkout_host:"checkout.example.com"}};
test("draft with no official checkout remains blocked even if price exists",()=>{
 const row=assessRubiLaunch(product,editorial);
 assert.equal(row.readyForRetail,false);
 assert.equal(row.grossMarginAmount,30);
 assert.equal(row.grossMarginPercent,30);
 assert.equal(row.blocking.length>=2,true);
});
test("valid host and verified URL count as technical catalog readiness, not payment proof",()=>{
 const good={...product,active:true,checkout_url:"https://checkout.example.com/buy",checkout_verified:true};
 const row=assessRubiLaunch(good,editorial);
 assert.equal(row.readyForRetail,true);
 assert.equal(row.recommendations.length>0,true);
});
test("foreign checkout host cannot be treated as ready",()=>{
 const bad={...product,active:true,checkout_url:"https://attacker.example.net/buy",checkout_verified:true};
 assert.equal(assessRubiLaunch(bad,editorial).readyForRetail,false);
});
test("supplier without permission or price must remain blocked",()=>{
 assert.equal(assessRubiLaunch({...product,active:true,retail_price:0},editorial).readyForRetail,false);
 assert.equal(assessRubiLaunch({...product,active:true,hub_suppliers:{active:false,checkout_host:"checkout.example.com"}},editorial).readyForRetail,false);
});
