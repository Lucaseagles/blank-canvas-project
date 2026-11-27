import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("SECURITY DEFINER functions expose only the intended execution roles", () => {
  const migration = read("../../supabase/migrations/20261128010000_rubi_definer_function_execute_grants.sql");
  const smoke = read("../../scripts/rubi-local-definer-function-grants-smoke.sql");
  const server = read("./relationships.functions.ts");

  assert.match(migration, /revoke all on function public\.append_admin_audit[\s\S]*?from public, anon/i);
  assert.match(migration, /grant execute on function public\.append_admin_audit[\s\S]*?to authenticated/i);
  assert.match(migration, /revoke all on function public\.get_eligible_benefit_popup[\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.get_eligible_benefit_popup[\s\S]*?to service_role/i);
  assert.match(migration, /revoke all on function public\.audit_marketplace_mutation[\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /has_function_privilege\('service_role'/i);
  assert.match(migration, /pg_catalog\.pg_trigger/i);
  assert.match(smoke, /anon unexpectedly executes append_admin_audit/i);
  assert.match(smoke, /browser role can execute server-only benefit popup/i);
  assert.match(smoke, /service_role cannot execute benefit popup/i);
  assert.match(server, /\(supabaseAdmin as any\)\.rpc\('get_eligible_benefit_popup'/);
});
