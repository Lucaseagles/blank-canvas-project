import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("./opportunity-engine.functions.ts");
const route = read("../routes/admin/opportunities.tsx");
const migration = read("../../supabase/migrations/20261126140000_rubi_opportunity_alert_atomic_audit.sql");

test("Owner opportunity status mutation uses audited RPC and verified server actor", () => {
  const block = api.split("export const updateOpportunityAlertStatus")[1] ?? "";
  assert.match(block, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(block, /rubi_update_opportunity_alert_status_audited/);
  assert.match(block, /p_actor:\s*context\.userId/);
  assert.match(block, /expectedUpdatedAt:\s*z\.string\(\)\.datetime/);
  assert.doesNotMatch(block, /update_opportunity_alert_status["']/);
});

test("opportunity UI submits the rendered revision to prevent stale overwrite", () => {
  assert.match(route, /expectedUpdatedAt:alert\.updated_at/);
  assert.match(api, /updated_at: string/);
});

test("SQL transition is Owner-only, row-locked, optimistic and atomically audited", () => {
  for (const token of [
    "security invoker", "for update", "Owner authorization required",
    "Opportunity alert changed; reload before saving",
    "insert into public.admin_audit_log",
    "RUBI_OPPORTUNITY_ALERT_STATUS_UPDATED",
    "revoke all on function public.rubi_update_opportunity_alert_status_audited",
    "grant execute on function public.rubi_update_opportunity_alert_status_audited",
    "revoke all on function public.update_opportunity_alert_status"
  ]) assert.ok(migration.toLowerCase().includes(token.toLowerCase()), token);
});
