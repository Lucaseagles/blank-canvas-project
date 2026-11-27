import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("./opportunity-engine.functions.ts");
const migration = read("../../supabase/migrations/20261126142000_rubi_opportunity_refresh_atomic_audit.sql");

test("Owner refresh uses audited RPC and verified server actor", () => {
  const block = api.split("export const refreshOpportunityAlerts")[1]?.split("export const updateOpportunityAlertStatus")[0] ?? "";
  assert.match(block, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(block, /rubi_refresh_opportunity_alerts_audited/);
  assert.match(block, /p_actor:\s*context\.userId/);
  assert.doesNotMatch(block, /refresh_opportunity_alerts["']/);
});

test("refresh is serialized and writes aggregate audit in same transaction", () => {
  for (const token of [
    "security invoker", "Owner authorization required", "pg_advisory_xact_lock",
    "on conflict(opportunity_type,source_id) do update",
    "status=case when public.opportunity_alerts.status='actioned'",
    "insert into public.admin_audit_log",
    "RUBI_OPPORTUNITY_ALERTS_REFRESHED",
    "revoke all on function public.rubi_refresh_opportunity_alerts_audited",
    "grant execute on function public.rubi_refresh_opportunity_alerts_audited",
    "revoke all on function public.refresh_opportunity_alerts"
  ]) assert.ok(migration.toLowerCase().includes(token.toLowerCase()), token);
});
