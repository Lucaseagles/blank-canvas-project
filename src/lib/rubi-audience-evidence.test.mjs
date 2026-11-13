import test from "node:test";
import assert from "node:assert/strict";
import {buildRubiAudienceEvidence} from "./rubi-audience-evidence.ts";
const valid={
 source:"Ficha verificada do fornecedor, protocolo 123",
 observedAt:"2026-10-20",
 method:"Entrevista voluntária documentada",
 finding:"Público relatou dificuldades na seleção de produtos para casa",
 counterEvidence:"Amostra pequena e não representativa",
 hypothesis:"Demonstração de uso ajuda a reduzir dúvidas práticas"
};
test("real evidence fields form a bounded review-pending record",()=>{
 const result=buildRubiAudienceEvidence(valid);
 assert.equal(result.valid,true);
 assert.match(result.notes,/REVISÃO HUMANA PENDENTE/);
 assert.match(result.notes,/Contraevidência\/limites:/);
});
test("missing proof and fabricated future dates do not qualify",()=>{
 const invalid=buildRubiAudienceEvidence({...valid,source:"",counterEvidence:"",observedAt:"2099-12-30"});
 assert.equal(invalid.valid,false);
 assert.equal(invalid.notes,"");
 assert.ok(invalid.issues.length>=3);
});
test("oversized evidence cannot bypass database field limit",()=>{
 const oversized=buildRubiAudienceEvidence({...valid,finding:"Explicação observada ".repeat(100)});
 assert.equal(oversized.valid,false);
 assert.match(oversized.issues.join(" "),/1.400 caracteres/);
});
