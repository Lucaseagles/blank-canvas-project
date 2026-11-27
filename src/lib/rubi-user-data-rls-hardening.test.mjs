import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("legacy public user-interest and favorites policies are removed without breaking authenticated ownership", () => {
  const migration = read("../../supabase/migrations/20261127235900_rubi_user_data_rls_policy_hardening.sql");
  const smoke = read("../../scripts/rubi-local-user-data-rls-hardening-smoke.sql");
  const engagement = read("./engagement.functions.ts");
  const personalization = read("./personalization.functions.ts");
  const catalog = read("../../scripts/rubi-local-admin-audit-catalog.sql");

  assert.match(migration, /drop policy if exists "Anyone can insert user_interests"/i);
  assert.match(migration, /drop policy if exists "Anyone can update their interests"/i);
  assert.match(migration, /drop policy if exists "Anyone can insert favorites"/i);
  assert.match(migration, /revoke insert, update, delete on table public\.user_interests from public, anon/i);
  assert.match(migration, /revoke insert, update, delete on table public\.favorites from public, anon/i);
  assert.match(migration, /Users can manage their own interests/);
  assert.match(migration, /Users can manage their own favorites/);
  assert.match(migration, /auth\.uid\(\).*user_id/s);

  for (const evidence of [
    "Authenticated user inserted an interest for another profile",
    "Authenticated user updated another profile interest",
    "Authenticated user inserted a favorite for another profile",
    "Authenticated user updated another profile favorite",
    "Anonymous client wrote user_interests",
    "Anonymous client wrote favorites",
    "Authenticated user could not insert own interest",
    "Authenticated user could not insert own favorite",
  ]) assert.ok(smoke.includes(evidence), evidence);

  assert.match(engagement, /middleware\(\[requireSupabaseAuth\]\)/);
  assert.match(engagement, /user_id: userId, product_id: productId/);
  assert.match(personalization, /await verifyOptionalUser\(userId\)/);
  assert.match(personalization, /supabaseAdmin\.from\("user_interests"\)/);
  assert.match(catalog, /unrestricted_public_write_policies/);
  assert.match(catalog, /coalesce\(p\.qual, ''\)/);
  assert.match(catalog, /coalesce\(p\.with_check, ''\)/);
});
