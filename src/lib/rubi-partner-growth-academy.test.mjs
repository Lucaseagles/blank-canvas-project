import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("one shared academy includes the four approved partner profiles and common formation", () => {
  const academy = read("../components/partner/RubiPartnerGrowthAcademy.tsx");
  const onboarding = read("../routes/onboarding.tsx");
  const portal = read("../routes/partner/portal.tsx");
  for (const type of ["affiliate", "micro_influencer", "influencer", "expert"]) {
    assert.ok(academy.includes(type), "missing specialization: " + type);
    assert.ok(onboarding.includes(type), "missing onboarding option: " + type);
  }
  assert.match(onboarding, /Nano ou microinfluenciador/);
  assert.match(academy, /Formação para todos os parceiros/);
  assert.match(academy, /Trilha Geral de Parceiros/);
  assert.match(academy, /specializations\[partnerType\] \?\?/);
  assert.match(portal, /<RubiPartnerGrowthAcademy/);
});

test("academy curriculum covers offer, content, attribution, backstage and ethical partner development", () => {
  const academy = read("../components/partner/RubiPartnerGrowthAcademy.tsx");
  for (const phrase of [
    "Produto, oferta e confiança",
    "Conteúdo que ajuda a decidir",
    "Distribuição, atribuição e métricas",
    "Backstage: campanhas, materiais e operação",
    "Indicação e desenvolvimento de parceiros",
    "não geram comissão",
    "margem e aprovação"
  ]) assert.ok(academy.includes(phrase), "missing curriculum contract: " + phrase);
});

test("execution progress derives only from actual portal link, visit and confirmed-sale metrics", () => {
  const academy = read("../components/partner/RubiPartnerGrowthAcademy.tsx");
  const portal = read("../routes/partner/portal.tsx");
  assert.match(academy, /links > 0/);
  assert.match(academy, /visits > 0/);
  assert.match(academy, /confirmedSales > 0/);
  assert.match(academy, /confirmedSales >= 5/);
  assert.match(academy, /confirmedSales >= 10/);
  assert.match(academy, /visits >= 10/);
  assert.match(academy, /developmentStage/);
  assert.match(academy, /Nível de desenvolvimento/);
  assert.match(academy, /não representa conclusão de curso/);
  assert.match(portal, /links=\{statsQuery\.data\?\.links \?\? 0\}/);
  assert.match(portal, /visits=\{statsQuery\.data\?\.visits \?\? 0\}/);
  assert.match(portal, /confirmedSales=\{salesQuery\.data\?\.sales \?\? 0\}/);
});

test("academy is available only inside the approved partner portal and does not alter finance or permissions", () => {
  const portal = read("../routes/partner/portal.tsx");
  const academy = read("../components/partner/RubiPartnerGrowthAcademy.tsx");
  assert.match(portal, /profile\?\.status === "approved"[\s\S]*?<RubiPartnerGrowthAcademy/);
  assert.match(academy, /Missões de execução/);
  assert.match(academy, /Consultar extrato/);
  assert.doesNotMatch(academy, /update\(|insert\(|upsert\(/);
  assert.doesNotMatch(academy, /commissionPercent|payout|setCommission/);
});


test("all three onboarding audiences share the premium responsive and accessible shell", () => {
  const onboarding = read("../routes/onboarding.tsx");
  const styles = read("../styles.css");
  assert.match(onboarding, /hub-onboarding-shell/);
  assert.match(onboarding, /hub-premium-surface hub-interactive/);
  assert.match(onboarding, /aria-pressed=\{audience === item\.id\}/);
  assert.match(onboarding, /focus-visible:outline/);
  for (const audience of ['consumer', 'merchant', 'partner']) assert.ok(onboarding.includes('id: "' + audience + '"'));
  assert.match(styles, /\.hub-onboarding-shell/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /@media \(max-width: 640px\)/);
});
