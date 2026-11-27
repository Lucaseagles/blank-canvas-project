import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(new URL("../../scripts/rubi-local-admin-audit-catalog.sql", import.meta.url), "utf8");
const workflow = readFileSync(new URL("../../.github/workflows/rubi-local-authenticated-e2e.yml", import.meta.url), "utf8");

test("catalog inventory is read-only and scoped to public schema metadata", () => {
  assert.match(sql, /from pg_catalog\.pg_class/i);
  assert.match(sql, /from pg_catalog\.pg_proc/i);
  assert.match(sql, /from pg_catalog\.pg_trigger/i);
  assert.match(sql, /from pg_catalog\.pg_policies/i);
  assert.match(sql, /relrowsecurity/i);
  assert.match(sql, /relforcerowsecurity/i);
  assert.match(sql, /has_table_privilege/i);
  assert.match(sql, /has_function_privilege/i);
  assert.match(sql, /pg_get_triggerdef/i);
  assert.match(sql, /unrestricted_public_write_policies/i);
  assert.match(sql, /p\.cmd in \('ALL', 'INSERT', 'UPDATE', 'DELETE'\)/i);
  assert.match(sql, /'public' = any\(p\.roles\) or 'anon' = any\(p\.roles\)/i);
  assert.doesNotMatch(sql, /\b(insert\s+into|update\s+public\.|delete\s+from|alter\s+table|drop\s+table)\b/i);
});

test("catalog inventory excludes function bodies and row-level business data", () => {
  assert.doesNotMatch(sql, /pg_get_functiondef/i);
  assert.doesNotMatch(sql, /select\s+\*\s+from\s+public\./i);
  assert.match(sql, /no rows, function bodies, credentials or secrets/i);
  assert.match(sql, /business-level audit completeness/i);
});

test("authenticated disposable E2E exports the catalog snapshot as a retained artifact", () => {
  assert.match(workflow, /rubi-local-admin-audit-catalog\.sql/);
  assert.match(workflow, /rubi-admin-audit-catalog\.json/);
  assert.match(workflow, /rubi-local-admin-audit-catalog/);
  assert.match(workflow, /-X -A -t -q -v ON_ERROR_STOP=1/);
  assert.match(workflow, /retention-days: 7/);
});
