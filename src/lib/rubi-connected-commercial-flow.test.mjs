import test from "node:test";
import assert from "node:assert/strict";
import {buildRubiConnectedFlowStages,nextRubiConnectedFlowAction} from "./rubi-connected-commercial-flow.ts";
const base={products:0,plansApproved:0,teams:0,membersActive:0,assignmentsReady:0,publicationsSubmitted:0,publicationsReviewed:0};
test("Every operational stage has a stable navigation target and independently observed count",()=>{
 const stages=buildRubiConnectedFlowStages({...base,teams:2,publicationsReviewed:1});
 assert.equal(stages.length,7);
 assert.deepEqual(stages.map(s=>s.value),[0,0,2,0,0,0,1]);
 assert.equal(new Set(stages.map(s=>s.anchor)).size,7);
});
test("Next action progresses through prerequisites without claiming sales",()=>{
 assert.equal(nextRubiConnectedFlowAction(base).anchor,"rubi-catalog-entry");
 assert.equal(nextRubiConnectedFlowAction({...base,products:1}).anchor,"rubi-movement-entry");
 assert.equal(nextRubiConnectedFlowAction({...base,products:1,plansApproved:1}).anchor,"rubi-team-entry");
 assert.equal(nextRubiConnectedFlowAction({...base,products:1,plansApproved:1,teams:1}).anchor,"rubi-team-members-entry");
 assert.equal(nextRubiConnectedFlowAction({...base,products:1,plansApproved:1,teams:1,membersActive:1}).anchor,"rubi-team-campaign-entry");
 assert.equal(nextRubiConnectedFlowAction({...base,products:1,plansApproved:1,teams:1,membersActive:1,assignmentsReady:1}).anchor,"rubi-team-publications-entry");
 assert.equal(nextRubiConnectedFlowAction({...base,products:1,plansApproved:1,teams:1,membersActive:1,assignmentsReady:1,publicationsSubmitted:1}).anchor,"rubi-team-publications-entry");
 assert.equal(nextRubiConnectedFlowAction({...base,products:1,plansApproved:1,teams:1,membersActive:1,assignmentsReady:1,publicationsReviewed:1}).anchor,"rubi-team-publication-audit-entry");
});
