import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("partner storefront has a stable opaque public code only for partner profiles", () => {
  const migration = read("../../supabase/migrations/20261119000100_rubi_partner_public_storefront.sql");
  assert.match(migration, /add column if not exists public_store_code text/);
  assert.match(migration, /where audience = 'partner' and public_store_code is null/);
  assert.match(migration, /unique index if not exists commercial_profiles_public_store_code_uniq/);
  assert.match(migration, /before insert on public\.commercial_profiles/);
  assert.match(migration, /revoke all on function public\.assign_partner_public_store_code\(\)/);
});

test("public storefront exposes only approved profile and granted active products", () => {
  const api = read("./partner-storefront.functions.ts");
  assert.match(api, /\.eq\("audience", "partner"\)/);
  assert.match(api, /\.eq\("status", "approved"\)/);
  assert.match(api, /hub_partner_product_grants/);
  assert.match(api, /\.eq\("active", true\)/);
  assert.match(api, /approvedRubiCheckout\(product\)/);
  assert.match(api, /referralCode: link\.code/);
  assert.match(api, /checkout_url/); // Used only for server-side checkout validation; never returned to the browser.
  assert.doesNotMatch(api, /checkoutUrl:|supplier_cost|commission_percent|commercial_profile_id:/);
});

test("partner storefront sends every product to its own attributed referral checkout route", () => {
  const route = read("../routes/loja.\$storeCode.tsx");
  assert.match(route, /createFileRoute\("\/loja\/\$storeCode"\)/);
  assert.match(route, /\/r\/\$\{product\.referralCode\}/);
  assert.match(route, /Ver oferta e continuar/);
  assert.match(route, /pagamento, aprovação do pedido, entrega, cancelamento e reembolso/i);
  assert.doesNotMatch(route, /currency:\s*"BRL"/);
  assert.match(route, /Confirme preço, moeda e disponibilidade no checkout responsável/);
});

test("partner onboarding keeps qualification context for later product matching", () => {
  const onboarding = read("../routes/onboarding.tsx");
  assert.match(onboarding, /creatorNiche/);
  assert.match(onboarding, /creatorBackground/);
  assert.match(onboarding, /audienceRange/);
  assert.match(onboarding, /creatorChannel/);
  assert.match(onboarding, /answers/);
});
