import test from "node:test";
import assert from "node:assert/strict";
import {assessRubiAudienceEvidenceStatus} from "./rubi-audience-evidence-status.ts";
import {buildRubiAudienceEvidence} from "./rubi-audience-evidence.ts";
const valid={
 source:"Ficha pública verificável do fornecedor ABC",observedAt:"2026-10-20",
 method:"Revisão documental com fonte disponível",
 finding:"O produto tem características descritas em sua ficha técnica",
 counterEvidence:"Fonte do fornecedor não prova aceitação do consumidor",
 hypothesis:"Uma demonstração do produto pode esclarecer dúvidas"
};
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
 const record=buildRubiAudienceEvidence(valid);
 assert.equal(record.valid,true);
 const r=assessRubiAudienceEvidenceStatus(record.notes);
 assert.equal(r.kind,"declared_pending_review");
 assert.equal(r.blockers.length,1);
 assert.match(r.label,/revisão humana pendente/);
 assert.match(r.blockers.join(" "),/não equivale à verificação independente/);
});
test("missing, short or duplicate fields cannot enter the review-ready state",()=>{
 const record=buildRubiAudienceEvidence(valid);
 const missing=assessRubiAudienceEvidenceStatus(record.notes.replace(/Hipótese: .*\n?/,""));
 const short=assessRubiAudienceEvidenceStatus(record.notes.replace(/Método: .*$/m,"Método: teste"));
 const duplicate=assessRubiAudienceEvidenceStatus(record.notes+"\nFonte: Outra referência verificável");
 assert.ok(missing.blockers.some(x=>x.includes("Hipótese")));
 assert.ok(short.blockers.some(x=>x.includes("Método")));
 assert.ok(duplicate.blockers.some(x=>x.includes("duplicado: Fonte")));
});
test("manually crafted future or impossible dates are blocked",()=>{
 const original=buildRubiAudienceEvidence(valid).notes;
 const future=assessRubiAudienceEvidenceStatus(original.replace("2026-10-20","2099-12-30"));
 const impossible=assessRubiAudienceEvidenceStatus(original.replace("2026-10-20","2026-02-31"));
 assert.ok(future.blockers.includes("Data inválida ou futura."));
 assert.ok(impossible.blockers.includes("Data inválida ou futura."));
});
test("oversized structured declarations are blocked before human review",()=>{
 const original=buildRubiAudienceEvidence(valid).notes;
 const crafted=original.replace(
  "Observação: O produto tem características descritas em sua ficha técnica",
  "Observação: "+"Observação documentada ".repeat(100)
 );
 const r=assessRubiAudienceEvidenceStatus(crafted);
 assert.ok(r.blockers.includes("Registro excede o limite de 1.400 caracteres."));
});
