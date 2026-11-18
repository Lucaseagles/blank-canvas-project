import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("automation rule status changes use the existing atomic Owner audit RPC", () => {
  const api = read("./automation.functions.ts");
  const start = api.indexOf("export const toggleRuleStatus");
  const end = api.indexOf("export const getAutomationLogs", start);
  const section = api.slice(start, end);
  assert.match(section, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(section, /rubi_update_admin_setting_audited/);
  assert.match(section, /p_source: "automation_rules"/);
  assert.match(section, /p_expected: \{ is_active: current\.is_active \}/);
  assert.match(section, /p_actor: context\.userId/);
  assert.doesNotMatch(section, /\.from\(["']automation_rules["']\)\.update\(/);
});

test("Command Center feature flags use the same atomic Owner audit contract", () => {
  const api = read("./command-center.functions.ts");
  const start = api.indexOf("export const setCommandCenterFeatureFlag");
  const section = api.slice(start);
  assert.match(section, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(section, /rubi_update_admin_setting_audited/);
  assert.match(section, /p_source: "feature_flags"/);
  assert.match(section, /p_expected: \{ is_enabled: current\.is_enabled \}/);
  assert.match(section, /p_actor: context\.userId/);
  assert.doesNotMatch(section, /\.from\(["']feature_flags["']\)\.update\(/);
});

test("the shared SQL contract remains transactionally audited and service-only", () => {
  const sql = read("../../supabase/migrations/20261113123000_rubi_admin_setting_atomic_audit.sql");
  assert.match(sql, /for update/);
  assert.match(sql, /insert into public\.admin_audit_log/);
  assert.match(sql, /if not exists\([\s\S]*r\.user_id=p_actor and r\.role='owner'/);
  assert.match(sql, /revoke all on function public\.rubi_update_admin_setting_audited/);
  assert.match(sql, /to service_role/);
});
