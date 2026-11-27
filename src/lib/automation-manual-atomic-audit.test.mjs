import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./automation.functions.ts", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../../supabase/migrations/20261127130000_rubi_manual_automation_atomic_audit.sql", import.meta.url),
  "utf8",
);

function section(name, nextName) {
  const start = source.indexOf(`export const ${name} =`);
  assert.notEqual(start, -1, `${name} must exist`);
  const end = nextName ? source.indexOf(`export const ${nextName} =`, start) : source.length;
  assert.notEqual(end, -1, `next section for ${name} must exist`);
  return source.slice(start, end);
}

test("manual trending remains on its pre-existing protected path", () => {
  const body = section("recalculateTrendingManual", "runRetentionCheck");
  assert.match(body, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(body, /refresh_demand_and_trend_scores/);
  assert.match(body, /logAutomationActivity/);
  assert.doesNotMatch(migration, /refresh_demand_and_trend_scores/);
});

test("manual retention delegates to the atomic actor-attributed RPC", () => {
  const body = section("runRetentionCheck", "processVideoLaunches");
  assert.match(body, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(body, /rubi_run_automation_action_audited/);
  assert.match(body, /p_action: "RUN_RETENTION_CHECK"/);
  assert.match(body, /p_actor: context\.userId/);
  assert.doesNotMatch(body, /run_retention_engine|logAutomationActivity/);
});

test("database RPC verifies Owner, serializes retention and commits audit in the same transaction", () => {
  assert.match(migration, /p_actor is null or not exists/i);
  assert.match(migration, /role::text='owner'/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /run_retention_engine\(3\)/i);
  assert.match(migration, /insert into public\.admin_audit_log/i);
  assert.match(migration, /actor_user_id,action_type,entity_type,entity_id/i);
  assert.match(migration, /revoke all on function public\.rubi_run_automation_action_audited/i);
  assert.match(migration, /grant execute on function public\.rubi_run_automation_action_audited[^;]*to service_role/i);
  assert.doesNotMatch(migration, /RECALCULATE_TRENDING/);
});
