import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("SECURITY DEFINER entry points have least-privilege execution grants", () => {
  const migration = read("../../supabase/migrations/20261127235970_rubi_security_definer_execute_hardening.sql");
  const smoke = read("../../scripts/rubi-local-security-definer-execute-hardening-smoke.sql");
  const benefits = read("../../supabase/migrations/20260831230000_sprint25_part2_benefits.sql");
  const adminAudit = read("../../supabase/migrations/20260901000000_sprint32_admin_audit.sql");
  const marketplace = read("../../supabase/migrations/20261117160000_rubi_marketplace_trigger_audit_hardening.sql");
  const relationships = read("./relationships.functions.ts");

  assert.match(migration, /revoke all on function public\.append_admin_audit[\s\S]*from public, anon, service_role/i);
  assert.match(migration, /grant execute on function public\.append_admin_audit[\s\S]*to authenticated/i);
  assert.match(migration, /revoke all on function public\.audit_marketplace_mutation\(\)[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.audit_marketplace_mutation\(\)[\s\S]*to service_role/i);
  assert.match(migration, /revoke all on function public\.get_eligible_benefit_popup\(uuid\)[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.get_eligible_benefit_popup\(uuid\)[\s\S]*to service_role/i);

  assert.match(adminAudit, /if auth\.uid\(\) is null/i);
  assert.match(adminAudit, /Owner access required/i);
  assert.match(marketplace, /returns trigger[\s\S]*security definer/i);
  assert.match(benefits, /coalesce\(p_user_id, auth\.uid\(\)\)/i);
  assert.match(relationships, /supabaseAdmin as any\)\.rpc\('get_eligible_benefit_popup'/);
  assert.match(smoke, /Authenticated non-Owner called append_admin_audit successfully/);
  assert.match(smoke, /Anonymous client executed get_eligible_benefit_popup/);
  assert.match(smoke, /Owner audit event was not persisted with auth\.uid\(\) as actor/);
});
