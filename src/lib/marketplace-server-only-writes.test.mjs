import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("marketplace writes use the audited Owner RPC and sensitive fields stay private", () => {
  const migration = read("../../supabase/migrations/20261127270000_rubi_marketplace_server_only_writes.sql");
  const rpc = read("../../supabase/migrations/20261117120000_rubi_marketplace_atomic_audit.sql");
  const api = read("./marketplace.functions.ts");
  const smoke = read("../../scripts/rubi-local-marketplace-server-only-writes-smoke.sql");
  const hub = read("../../.github/workflows/hub-v1-integration-qa.yml");
  const e2e = read("../../.github/workflows/rubi-local-authenticated-e2e.yml");

  assert.ok(migration.includes('drop policy if exists "Admin marketplaces manage"'));
  assert.ok(migration.includes('drop policy if exists "Admins manage marketplaces"'));
  assert.ok(migration.includes("create policy marketplaces_owner_select_s362"));
  assert.ok(migration.includes("revoke insert, update, delete, truncate, references, trigger"));
  assert.ok(migration.includes("revoke select (api_config, api_status, affiliate_link_structure)"));
  assert.ok(migration.includes("grant select (id, name, slug, status, created_at)"));
  assert.ok(migration.includes("rubi_manage_marketplace_audited"));
  assert.ok(rpc.includes("MARKETPLACE_CREDENTIALS_UPDATED"));
  assert.ok(rpc.includes("values_redacted"));

  assert.ok(api.includes('rpc("rubi_manage_marketplace_audited"'));
  assert.ok(api.includes("p_actor: context.userId"));
  assert.doesNotMatch(api, /from\(["']marketplaces["']\)\.(insert|update|delete)/);

  assert.ok(smoke.includes("Browser role retains direct marketplace DML"));
  assert.ok(smoke.includes("Marketplace API credentials/status remain visible"));
  assert.ok(smoke.includes("RUBI_QA_EXPECTED_MARKETPLACE_INSERT_DENIAL_NOT_RAISED"));
  assert.ok(smoke.includes("RUBI_QA_EXPECTED_MARKETPLACE_UPDATE_DENIAL_NOT_RAISED"));
  assert.ok(smoke.includes("RUBI_QA_EXPECTED_MARKETPLACE_DELETE_DENIAL_NOT_RAISED"));
  assert.ok(hub.includes("marketplace-server-only-writes.test.mjs"));
  assert.ok(e2e.includes("rubi-local-marketplace-server-only-writes-smoke.sql"));
});
