import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("brand identity update uses the Owner-gated audited RPC and never direct upsert", () => {
  const api = read("./brand-identity.functions.ts");
  const migration = read("../../supabase/migrations/20261126083000_rubi_brand_identity_atomic_audit.sql");
  const mutation = api.slice(api.indexOf("export const updateBrandIdentity"));
  assert.match(mutation, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(mutation, /p_actor:\s*context\.userId/);
  assert.match(mutation, /rpc\("rubi_update_brand_identity_audited"/);
  assert.doesNotMatch(mutation, /\.upsert\(|\.insert\(|\.update\(/);
  for (const token of [
    "security invoker", "set search_path=''", "Owner authorization required",
    "pg_advisory_xact_lock", "for update", "insert into public.admin_audit_log",
    "RUBI_BRAND_IDENTITY_UPDATED", "values_redacted",
    "revoke all on function public.rubi_update_brand_identity_audited",
    "to service_role"
  ]) assert.ok(migration.toLowerCase().includes(token.toLowerCase()), token);
  assert.match(migration, /id=true/);
  assert.match(migration, /length\(btrim\(p_display_name\)\) not between 2 and 80/);
});

test("brand identity audit payload records metadata only, not the brand name", () => {
  const migration = read("../../supabase/migrations/20261126083000_rubi_brand_identity_atomic_audit.sql");
  const audit = migration.slice(migration.indexOf("insert into public.admin_audit_log"));
  assert.match(audit, /changed_fields/);
  assert.match(audit, /values_redacted/);
  assert.doesNotMatch(audit, /p_display_name|v_before->>|v_after->>/);
});
