import test from "node:test";
import assert from "node:assert/strict";
import {emptyRubiQaChecklist,rubiQaReview,RUBI_LAUNCH_QA_ITEMS} from "./rubi-launch-qa.ts";
test("New product has no pre-approved operational gates",()=>{
 const row=emptyRubiQaChecklist("p");
 assert.equal(rubiQaReview(row).allAttested,false);
 assert.equal(rubiQaReview(row).verified,0);
 assert.equal(RUBI_LAUNCH_QA_ITEMS.length,5);
});
test("Claiming verified without evidence is rejected and no payment results are inferred",()=>{
 const row={...emptyRubiQaChecklist("p"),domain:{status:"verified",evidence:""}};
 assert.equal(rubiQaReview(row).invalid.length,1);
 assert.equal(rubiQaReview(row).allAttested,false);
});
test("All manual gates require evidence; blocked items never count as passed",()=>{
 const row=emptyRubiQaChecklist("p");
 for(const item of RUBI_LAUNCH_QA_ITEMS)row[item.key]={status:"verified",evidence:"Conferido em ambiente oficial"};
 assert.equal(rubiQaReview(row).allAttested,true);
 row.supplier.status="blocked";
 assert.equal(rubiQaReview(row).allAttested,false);
 assert.deepEqual(rubiQaReview(row).blocked,["Checkout oficial e autorização"]);
});
