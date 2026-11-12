import test from "node:test";
import assert from "node:assert/strict";
import {assessRubiExperimentReadiness} from "./rubi-experiment-readiness.ts";
import {emptyRubiMovementVariant} from "./rubi-movement-variants.ts";
const movement="00000000-0000-4000-8000-000000000001";
function variant(id,hook,format="short_video"){
 return {...emptyRubiMovementVariant(movement),id,name:"Variante "+id,format,
  creative_hook:hook,status:"review",media_rights_confirmed:true};
}
test("AB planning requires two reviewed, comparable variants",()=>{
 const a=variant("a","Demonstração transparente");
 const b=variant("b","Avaliação verificável");
 const result=assessRubiExperimentReadiness([b,a],"review");
 assert.equal(result.eligible,true);
 assert.equal(result.controlId,"a");
 assert.equal(result.challengerId,"b");
});
test("draft movements and duplicate hooks never qualify",()=>{
 const pair=[variant("a","Mesmo gancho"),variant("b"," mesmo gancho ")];
 assert.equal(assessRubiExperimentReadiness(pair,"draft").eligible,false);
 assert.match(assessRubiExperimentReadiness(pair,"review").reasons.join(" "),/ganchos são idênticos/);
});
test("a third variant, mismatched formats, and missing rights stop comparison",()=>{
 const a=variant("a","Demonstração");
 const b=variant("b","Resultados","story");
 assert.equal(assessRubiExperimentReadiness([a,b],"review").eligible,false);
 assert.equal(assessRubiExperimentReadiness([a,b,variant("c","Terceiro")],"review").eligible,false);
 assert.equal(assessRubiExperimentReadiness([a,{...variant("b","Novo gancho"),media_rights_confirmed:false}],"review").eligible,false);
});
test("not enough reviewed variants cannot imply test or winning result",()=>{
 const result=assessRubiExperimentReadiness([variant("a","Criativo")],"review");
 assert.equal(result.eligible,false);
 assert.equal(result.controlId,null);
});
