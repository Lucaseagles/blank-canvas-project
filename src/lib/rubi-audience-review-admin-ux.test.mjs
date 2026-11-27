import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("Master review clearly separates evidence readiness, version decisions and market validation",()=>{
 const panel=read("../components/store/RubiAudienceEvidenceReviewAdmin.tsx");
 const server=read("./rubi-audience-review.functions.ts");
 assert.match(panel,/Integridade da evidência/);
 assert.match(panel,/Histórico/);
 assert.match(panel,/não transforma uma hipótese em público validado/);
 assert.match(panel,/alreadyReviewedCurrentVersion/);
 assert.match(panel,/latest\.movement_revision!==movementRevision/);
 assert.match(panel,/Nenhuma decisão documental registrada/);
 assert.match(panel,/Tentar novamente/);
 assert.match(panel,/Atualizar histórico/);
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/movement\.revision!==data\.movementRevision/);
 assert.match(server,/rubi_record_audience_review_audited/);
});

test("A documentary decision cannot be repeated on the same movement revision in the UI",()=>{
 const panel=read("../components/store/RubiAudienceEvidenceReviewAdmin.tsx");
 assert.match(panel,/disabled=\{!canReview\|\|alreadyReviewedCurrentVersion\|\|mutation\.isPending\}/);
 assert.match(panel,/Para uma nova análise, atualize e salve o movimento/);
 assert.match(panel,/Registro histórico imutável/);
});
