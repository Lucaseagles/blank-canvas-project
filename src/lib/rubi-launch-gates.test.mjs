import test from "node:test";
import assert from "node:assert/strict";
import {assessRubiLaunchGate} from "./rubi-launch-gates.ts";
import {emptyRubiQaChecklist,RUBI_LAUNCH_QA_ITEMS} from "./rubi-launch-qa.ts";
test("A catalog-ready product without operational checks is not launch-reviewed",()=>{
 const gate=assessRubiLaunchGate(true,null);
 assert.equal(gate.catalogReady,true);
 assert.equal(gate.launchReviewed,false);
 assert.equal(gate.qaVerified,0);
 assert.equal(gate.qaMissing.length,5);
});
test("A checked product needs verified evidence in each operational category",()=>{
 const qa=emptyRubiQaChecklist("p");
 for(const key of RUBI_LAUNCH_QA_ITEMS)qa[key.key]={status:"verified",evidence:"Verificado manualmente"};
 assert.equal(assessRubiLaunchGate(true,qa).launchReviewed,true);
 assert.equal(assessRubiLaunchGate(false,qa).launchReviewed,false);
 qa.mobile={status:"verified",evidence:""};
 assert.equal(assessRubiLaunchGate(true,qa).launchReviewed,false);
 qa.mobile={status:"blocked",evidence:"Falha de navegação"};
 assert.equal(assessRubiLaunchGate(true,qa).qaBlocked.length,1);
});
