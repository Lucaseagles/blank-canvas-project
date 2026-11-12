import test from "node:test";
import assert from "node:assert/strict";
import {buildRubiMasterGrowthPlaybooks} from "./rubi-master-growth-playbooks.ts";
const base={totalProducts:0,readyProducts:0,activeSuppliersWithoutHost:0,productAuditPartial:false,partnerApproved:0,partnerPending:0,partnerActiveLinks:0,partnerVisits30d:0,partnerConfirmedSales30d:0,merchantApproved:0};
test("The Master sees three acquisition strategies plus B2B, not fake readiness",()=>{
 const plans=buildRubiMasterGrowthPlaybooks(base);
 assert.deepEqual(plans.map(p=>p.id),["ai_seller","direct","creators","merchant"]);
 assert.equal(plans[0]?.phase,"blocked");
 assert.equal(plans[1]?.phase,"blocked");
 assert.match(plans[0]?.nextStep??"",/produtos cadastrados/);
 assert.equal(plans[2]?.phase,"setup");
});
test("Supplier checkout blocker takes precedence over paid media planning",()=>{
 const plans=buildRubiMasterGrowthPlaybooks({...base,totalProducts:2,activeSuppliersWithoutHost:1});
 assert.equal(plans[0]?.phase,"blocked");
 assert.match(plans[1]?.nextStep??"",/fornecedor ativo sem domínio/);
});
test("Proposed campaigns remain preparation only after valid inventory",()=>{
 const plans=buildRubiMasterGrowthPlaybooks({...base,totalProducts:2,readyProducts:2,partnerApproved:4,partnerActiveLinks:2,partnerVisits30d:6,partnerConfirmedSales30d:1,merchantApproved:1});
 assert.equal(plans[0]?.phase,"setup");
 assert.equal(plans[1]?.phase,"setup");
 assert.equal(plans[2]?.phase,"measure");
 assert.match(plans[2]?.rationale??"",/1 vendas confirmadas/);
 assert.equal(plans[3]?.phase,"measure");
});
test("Pending creator applications are prioritized and partial inventory does not invite scaling",()=>{
 const plans=buildRubiMasterGrowthPlaybooks({...base,totalProducts:250,readyProducts:10,productAuditPartial:true,partnerPending:3});
 assert.equal(plans[0]?.phase,"blocked");
 assert.match(plans[2]?.nextStep??"",/solicitações pendentes/);
});
