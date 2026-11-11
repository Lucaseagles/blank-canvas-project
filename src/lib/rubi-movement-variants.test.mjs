import test from "node:test";
import assert from "node:assert/strict";
import {emptyRubiMovementVariant,rubiVariantChecklist,canReviewRubiVariant} from "./rubi-movement-variants.ts";
test("new variant is private and has no payment URL or public flag",()=>{
 const v=emptyRubiMovementVariant("00000000-0000-4000-8000-000000000001");
 assert.equal(v.status,"draft");assert.equal(v.media_rights_confirmed,false);
 assert.equal(Object.hasOwn(v,"checkout_url"),false);assert.equal(Object.hasOwn(v,"published_at"),false);
 assert.equal(canReviewRubiVariant(v),false);
});
test("variant needs media rights and evidence before review",()=>{
 const v={...emptyRubiMovementVariant("00000000-0000-4000-8000-000000000001"),name:"Variação A",creative_hook:"Gancho coerente",creative_script:"Roteiro verificável com demonstração real.",page_headline:"Página com benefício real",page_body:"Um texto que apresenta detalhes reais do produto.",call_to_action:"Conhecer produto",proof_notes:"Ficha oficial do fornecedor consultada."};
 assert.equal(rubiVariantChecklist(v).missing.includes("Direitos das mídias"),true);
 assert.equal(canReviewRubiVariant({...v,media_rights_confirmed:true}),true);
});
