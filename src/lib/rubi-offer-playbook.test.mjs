import test from "node:test";
import assert from "node:assert/strict";
import { emptyRubiOfferPlaybook, rubiOfferReadiness, RUBI_OFFER_CHANNELS } from "./rubi-offer-playbook.ts";

test("offer engine creates private drafts without invented proof or checkout data", () => {
  const draft = emptyRubiOfferPlaybook("00000000-0000-4000-8000-000000000001", "Produto Exemplo", "Descrição fornecida");
  assert.equal(draft.stage, "draft");
  assert.equal(draft.promise, "");
  assert.equal(draft.verified_benefits, "");
  assert.equal(draft.proof_notes, "");
  assert.deepEqual(draft.channels, []);
  assert.equal(Object.hasOwn(draft, "checkout_url"), false);
  assert.equal(rubiOfferReadiness(draft).score < 100, true);
});

test("offer engine checks completeness, not performance", () => {
  const draft = emptyRubiOfferPlaybook("00000000-0000-4000-8000-000000000001", "Produto Exemplo", null);
  const complete = {
    ...draft,
    promise: "Uma proposta de valor que será verificada.",
    verified_benefits: "Benefícios verificados com o fornecedor.",
    proof_notes: "Ficha oficial do produto anexada externamente.",
    creative_hook: "Descubra este produto",
    creative_script: "Um roteiro completo que detalha o produto e seu uso.",
    page_headline: "Conheça o produto oficial",
    page_body: "Descrição detalhada e fiel ao produto, sem prometer resultados.",
    objections: "Informações sobre suporte, prazo e condições.",
    movement_plan: "Revisar as artes antes de publicar manualmente nos canais.",
    channels: ["instagram"],
  };
  assert.deepEqual(rubiOfferReadiness(complete), { score: 100, missing: [] });
  assert.equal(RUBI_OFFER_CHANNELS.some(item => item.value === "instagram"), true);
});
