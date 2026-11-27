import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const card=await readFile(new URL("../components/store/RubiAudienceEvidenceStatusCard.tsx",import.meta.url),"utf8");
const editor=await readFile(new URL("../components/store/RubiMovementEngineAdmin.tsx",import.meta.url),"utf8");
test("Master evidence status distinguishes missing, legacy and pending-review states",()=>{
 for(const state of ["missing","legacy_unstructured","declared_pending_review"])assert.ok(card.includes(state));
 assert.match(card,/aria-live="polite"/);
 assert.match(card,/revisão pendente/);
});
test("premium evidence panel never equates document review with market validation",()=>{
 assert.match(card,/não valida o mercado/);
 assert.match(card,/validação de mercado exige dados reais independentes/);
});
test("editorial preparation exposes an accessible progress indicator",()=>{
 assert.match(editor,/role="progressbar"/);
 assert.match(editor,/aria-valuenow=\{checklistPercent\}/);
 assert.match(editor,/RubiAudienceEvidenceStatusCard/);
});
