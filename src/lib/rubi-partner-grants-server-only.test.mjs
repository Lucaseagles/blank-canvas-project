import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("partner product grants are server-only at the database privilege layer", () => {
  const sql = read("../../supabase/migrations/20261118001500_rubi_partner_grants_server_only.sql");
  assert.match(sql,/revoke all privileges on table public\.hub_partner_product_grants from public, anon, authenticated/i);
  assert.match(sql,/grant all privileges on table public\.hub_partner_product_grants to service_role/i);
  assert.match(sql,/RLS remains enabled/i);
});

test("partner grant reads and writes stay behind server functions", () => {
  const admin = read("./partner-product-grants.functions.ts");
  const portal = read("./partner-portal.functions.ts");
  const referrals = read("./partner-referrals.functions.ts");
  assert.match(admin,/middleware\(\[requireOwnerRole\]\)/);
  assert.match(admin,/rubi_set_partner_product_grant_audited/);
  assert.match(portal,/supabaseAdmin\.auth\.getUser/);
  assert.match(referrals,/supabaseAdmin\.auth\.getUser/);
  assert.match(portal,/hub_partner_product_grants/);
  assert.match(referrals,/hub_partner_product_grants/);
});
