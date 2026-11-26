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
  assert.match(onboarding, /Nano ou microcriador/);
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

test("individual lesson completion is persisted per approved partner and isolated by profile", () => {
  const academy = read("../components/partner/RubiPartnerGrowthAcademy.tsx");
  const portal = read("../routes/partner/portal.tsx");
  const server = read("./rubi-partner-academy-progress.functions.ts");
  const migration = read("../../supabase/migrations/20261126150000_rubi_partner_academy_progress.sql");
  for (const lessonKey of [
    "common:foundations", "common:product-offer", "common:content",
    "common:distribution", "common:backstage", "common:network",
    "affiliate:catalog-to-sale", "micro_influencer:community",
    "influencer:campaigns", "expert:authority"
  ]) {
    assert.ok(academy.includes(lessonKey), "missing stable lesson key " + lessonKey);
    assert.ok(server.includes(lessonKey), "server does not allow lesson key " + lessonKey);
  }
  assert.match(server, /auth\.getUser\(accessToken\)/);
  assert.match(server, /eq\("audience","partner"\)\.eq\("status","approved"\)/);
  assert.match(server, /allowedLessons\(String\(profile\.partner_type/);
  assert.match(server, /rpc\("rubi_get_partner_academy_progress"/);
  assert.match(server, /rpc\("rubi_set_partner_academy_lesson_completion"/);
  assert.match(migration, /delete from public\.hub_partner_academy_progress/i);
  assert.match(migration, /progress\.user_id=p_actor/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on public\.hub_partner_academy_progress from public, anon, authenticated/i);
  assert.match(migration, /grant all on public\.hub_partner_academy_progress to service_role/i);
  assert.match(migration, /unique \(commercial_profile_id, lesson_key\)/i);
  assert.match(migration, /security definer/i);
  assert.ok(migration.includes("revoke all on function public.rubi_get_partner_academy_progress"));
  assert.ok(migration.includes("grant execute on function public.rubi_set_partner_academy_lesson_completion(uuid,text,boolean) to service_role"));
  assert.match(academy, /Marcar aula como concluída/);
  assert.match(academy, /Aula concluída · desfazer/);
  assert.match(academy, /rubi-partner-academy-progress/);
  assert.match(academy, /queryKey: \["rubi-partner-academy-progress", commercialProfileId, partnerType\]/);
  assert.match(portal, /<RubiPartnerGrowthAcademy commercialProfileId=\{profile\.id\}/);
  assert.match(academy, /Salvo na sua conta e separado das metas comerciais/);
  const smoke = read("../../scripts/rubi-local-partner-academy-progress-smoke.sql");
  assert.match(smoke, /has_table_privilege/);
  assert.match(smoke, /has_function_privilege/);
  assert.match(smoke, /Profile-specific lesson restriction failed/);
  assert.match(smoke, /Unchecking lesson did not remove persisted progress/);
});
