import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Opportunity Engine direct table DML is revoked while Owner read and audited RPC writes remain", () => {
  const migration = read("../../supabase/migrations/20261127210000_rubi_opportunity_alert_dml_hardening.sql");
  const api = read("./opportunity-engine.functions.ts");
  const statusRpc = read("../../supabase/migrations/20261126141000_rubi_opportunity_alert_atomic_audit.sql");
  const refreshRpc = read("../../supabase/migrations/20261126142000_rubi_opportunity_refresh_atomic_audit.sql");
  const smoke = read("../../scripts/rubi-local-opportunity-alert-audit-smoke.sql");

  assert.match(migration, /drop policy if exists opportunity_alerts_owner_all/i);
  assert.match(migration, /create policy opportunity_alerts_owner_select[\s\S]*for select[\s\S]*to authenticated/i);
  assert.match(migration, /revoke all privileges[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant select[\s\S]*to authenticated/i);
  assert.match(migration, /grant all privileges[\s\S]*to service_role/i);
  assert.match(migration, /revoke all on function public\.get_opportunity_alerts\(text\) from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.get_opportunity_alerts\(text\) to service_role/i);

  assert.match(api, /rubi_refresh_opportunity_alerts_audited/);
  assert.match(api, /rubi_update_opportunity_alert_status_audited/);
  assert.doesNotMatch(api, /from\(["']opportunity_alerts["']\)\.(insert|update|delete|upsert)/i);

  assert.match(statusRpc, /Owner authorization required/);
  assert.match(statusRpc, /insert into public\.admin_audit_log/i);
  assert.match(statusRpc, /revoke all on function public\.rubi_update_opportunity_alert_status_audited/i);
  assert.match(refreshRpc, /Owner authorization required/);
  assert.match(refreshRpc, /insert into public\.admin_audit_log/i);
  assert.match(refreshRpc, /revoke all on function public\.rubi_refresh_opportunity_alerts_audited/i);

  assert.match(smoke, /has_table_privilege\('authenticated',[\s\S]*'INSERT'/i);
  assert.match(smoke, /RUBI_QA_EXPECTED_DIRECT_UPDATE_DENIAL_NOT_RAISED/);
  assert.match(smoke, /RUBI_QA_EXPECTED_DIRECT_INSERT_DENIAL_NOT_RAISED/);
  assert.match(smoke, /RUBI_QA_EXPECTED_DIRECT_DELETE_DENIAL_NOT_RAISED/);
  assert.match(smoke, /Owner read policy did not expose/);
});
