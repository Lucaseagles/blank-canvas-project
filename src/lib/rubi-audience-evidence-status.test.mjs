import test from "node:test";
import assert from "node:assert/strict";
import {assessRubiAudienceEvidenceStatus} from "./rubi-audience-evidence-status.ts";
import {buildRubiAudienceEvidence} from "./rubi-audience-evidence.ts";
test("empty evidence is not mistaken for verified market research",()=>{
 const r=assessRubiAudienceEvidenceStatus("");
 assert.equal(r.kind,"missing");
 assert.ok(r.blockers.length>0);
});
test("legacy notes remain unverified",()=>{
 const r=assessRubiAudienceEvidenceStatus("Ficha do fornecedor aprovada pelo operador");
 assert.equal(r.kind,"legacy_unstructured");
});
test("structured declarations still require independent verification",()=>{
 const record=buildRubiAudienceEvidence({
  source:"Ficha pública do fornecedor ABC",observedAt:"2026-10-20",
  method:"Revisão documental com fonte disponível",
  finding:"O produto tem características descritas em sua ficha técnica",
  counterEvidence:"Fonte do fornecedor não prova aceitação do consumidor",
  hypothesis:"Uma demonstração do produto pode esclarecer dúvidas"
 });
 assert.equal(record.valid,true);
 const r=assessRubiAudienceEvidenceStatus(record.notes);
 assert.equal(r.kind,"declared_pending_review");
 assert.match(r.label,/revisão humana pendente/);
 assert.match(r.blockers.join(" "),/não equivale à verificação independente/);
});
test("declared record missing fields warns instead of appearing complete",()=>{
 const r=assessRubiAudienceEvidenceStatus("[VALIDAÇÃO DECLARADA — REVISÃO HUMANA PENDENTE]\nFonte: Material");
 assert.equal(r.kind,"declared_pending_review");
 assert.ok(r.blockers.some(x=>x.includes("Hipótese")));
});
