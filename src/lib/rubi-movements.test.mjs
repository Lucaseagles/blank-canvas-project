import test from "node:test";
import assert from "node:assert/strict";
import {emptyRubiMovement,rubiMovementChecklist,canReviewRubiMovement} from "./rubi-movements.ts";
test("Movement draft does not invent evidence or publish",()=>{
 const m=emptyRubiMovement("00000000-0000-4000-8000-000000000001");
 assert.equal(m.evidence_notes,"");
 assert.equal(m.status,"draft");
 assert.equal(canReviewRubiMovement(m),false);
 assert.equal(Object.hasOwn(m,"checkout_url"),false);
});
test("Ready for review requires all editorial inputs",()=>{
 const m={...emptyRubiMovement("00000000-0000-4000-8000-000000000001"),
 name:"Sua Casa Seu Olhar",buyer_persona:"Moradores responsáveis",problem:"Acompanhar residência",desired_outcome:"Monitoramento autorizado",truthful_promise:"Acompanhar ambiente com consentimento",differentiator:"Aplicação no ambiente residencial",narrative:"Uma demonstração genuína do produto e seus recursos reais.",evidence_notes:"Consultar ficha oficial do fornecedor."};
 assert.deepEqual(rubiMovementChecklist(m),{completed:8,total:8,missing:[]});
 assert.equal(canReviewRubiMovement(m),true);
});

test("repeated sales claims cannot pass the movement editorial review",()=>{
 const m={...emptyRubiMovement("00000000-0000-4000-8000-000000000001"),
 name:"Movimento Seguro",buyer_persona:"Público com interesse declarado",
 problem:"Público com interesse declarado",desired_outcome:"Solução demonstrada com evidências",
 truthful_promise:"Promessa limitada aos recursos verificados",differentiator:"Diferença explicada de forma transparente",
 narrative:"Uma descrição editorial extensa e fiel aos recursos efetivamente comprovados.",
 evidence_notes:"Prova documental verificada antes de publicar"};
 assert.equal(rubiMovementChecklist(m).missing.length,0);
 assert.equal(canReviewRubiMovement(m),false);
 m.problem="Uma necessidade real documentada na pesquisa";
 assert.equal(canReviewRubiMovement(m),true);
});
