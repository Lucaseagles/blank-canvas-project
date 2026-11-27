import test from "node:test";
import assert from "node:assert/strict";
import {assessRubiAudienceEvidenceStatus} from "./rubi-audience-evidence-status.ts";
import {buildRubiAudienceEvidence} from "./rubi-audience-evidence.ts";
const valid={source:"Ficha pública verificável do fornecedor ABC",sourceKind:"supplier_document",observedAt:"2026-10-20",sampleSize:0,consentConfirmed:false,containsPersonalData:false,method:"Revisão documental com fonte disponível",finding:"O produto tem características descritas em sua ficha técnica",counterEvidence:"Fonte do fornecedor não prova aceitação do consumidor",hypothesis:"Uma demonstração do produto pode esclarecer dúvidas"};
test("empty evidence is not mistaken for verified market research",()=>{const r=assessRubiAudienceEvidenceStatus("");assert.equal(r.kind,"missing");assert.ok(r.blockers.length>0);});
test("legacy notes remain unverified",()=>assert.equal(assessRubiAudienceEvidenceStatus("Ficha do fornecedor aprovada pelo operador").kind,"legacy_unstructured"));
test("structured declarations require independent verification after metadata checks",()=>{const record=buildRubiAudienceEvidence(valid);assert.equal(record.valid,true);const r=assessRubiAudienceEvidenceStatus(record.notes);assert.equal(r.kind,"declared_pending_review");assert.equal(r.blockers.length,1);assert.match(r.blockers.join(" "),/não equivale à verificação independente/);});
test("participant sample and consent cannot be bypassed by hand-crafted notes",()=>{
 const notes=buildRubiAudienceEvidence({...valid,sourceKind:"interview",sampleSize:0,consentConfirmed:false}).notes;
 const crafted=notes||[
 "[VALIDAÇÃO DECLARADA — REVISÃO HUMANA PENDENTE]","Fonte: Pesquisa real documentada","Tipo de fonte: interview","Data: 2026-10-20","Amostra: 0","Consentimento: não aplicável","Dados pessoais: não incluídos","Método: Entrevista voluntária documentada","Observação: Participantes relataram dúvidas recorrentes","Contraevidência/limites: Amostra limitada","Hipótese: Demonstração pode reduzir dúvidas"
 ].join("\n");
 const r=assessRubiAudienceEvidenceStatus(crafted);assert.ok(r.blockers.some(x=>x.includes("amostra positiva")));assert.ok(r.blockers.some(x=>x.includes("consentimento confirmado")));
});
test("missing, short or duplicate fields cannot enter the review-ready state",()=>{
 const record=buildRubiAudienceEvidence(valid);
 const missing=assessRubiAudienceEvidenceStatus(record.notes.replace(/Hipótese: .*\n?/,""));
 const short=assessRubiAudienceEvidenceStatus(record.notes.replace(/Método: .*$/m,"Método: teste"));
 const duplicate=assessRubiAudienceEvidenceStatus(record.notes+"\nFonte: Outra referência verificável");
 assert.ok(missing.blockers.some(x=>x.includes("Hipótese")));assert.ok(short.blockers.some(x=>x.includes("Método")));assert.ok(duplicate.blockers.some(x=>x.includes("duplicado: Fonte")));
});
test("hand-crafted documentary records cannot bypass sample, consent or HTTPS rules",()=>{
 const record=buildRubiAudienceEvidence(valid).notes;
 const invalidSample=assessRubiAudienceEvidenceStatus(record.replace("Amostra: 0","Amostra: -4"));
 const invalidConsent=assessRubiAudienceEvidenceStatus(record.replace("Consentimento: não aplicável","Consentimento: talvez"));
 const insecureSource=assessRubiAudienceEvidenceStatus(record.replace("Fonte: Ficha pública verificável do fornecedor ABC","Fonte: http://example.com/research"));
 assert.ok(invalidSample.blockers.some(x=>x.includes("Amostra deve ser")));
 assert.ok(invalidConsent.blockers.some(x=>x.includes("consentimento inválido")));
 assert.ok(insecureSource.blockers.some(x=>x.includes("HTTPS")));
});
test("future and impossible dates are blocked",()=>{const original=buildRubiAudienceEvidence(valid).notes;assert.ok(assessRubiAudienceEvidenceStatus(original.replace("2026-10-20","2099-12-30")).blockers.includes("Data inválida ou futura."));assert.ok(assessRubiAudienceEvidenceStatus(original.replace("2026-10-20","2026-02-31")).blockers.includes("Data inválida ou futura."));});
