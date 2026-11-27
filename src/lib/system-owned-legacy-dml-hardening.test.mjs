import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("system-owned logs/queue and present legacy configs are not directly writable by API roles", () => {
  const migration = read("../../supabase/migrations/20261127250000_rubi_system_owned_legacy_dml_hardening.sql");
  const workerMigration = read("../../supabase/migrations/20260830165004_sprint24_content_affinity_notifications.sql");
  const workerHardening = read("../../supabase/migrations/20261124120000_sprint306_harden_content_notification_queue_temp_table.sql");
  const supportAi = read("../../supabase/functions/support-ai/index.ts");
  const smoke = read("../../scripts/rubi-local-system-owned-legacy-dml-hardening-smoke.sql");

  for (const table of ["content_notification_queue", "content_affinity_log"]) {
    assert.ok(migration.includes("public." + table), table);
    assert.ok(migration.includes("revoke all privileges on table"), table);
    assert.ok(migration.includes("grant all privileges on table"), table);
  }

  assert.ok(migration.includes('"owner manages content notification queue"'));
  assert.ok(migration.includes('"owner manages content affinity logs"'));
  assert.ok(migration.includes('"owner can view content notification queue"'));
  assert.ok(migration.includes('"owner can view content affinity logs"'));

  for (const table of ["support_ai_config", "offer_products", "recommendation_config"]) {
    assert.ok(migration.includes("to_regclass('public." + table + "') is not null"), table);
    assert.ok(migration.includes("public." + table), table);
  }

  assert.ok(workerMigration.includes("calculate_content_affinity(uuid,text)"));
  assert.ok(workerMigration.includes("process_content_notification_queue(integer)"));
  assert.ok(workerMigration.includes("GRANT EXECUTE ON FUNCTION public.calculate_content_affinity(uuid,text) TO service_role"));
  assert.ok(workerMigration.includes("GRANT EXECUTE ON FUNCTION public.process_content_notification_queue(integer) TO service_role"));
  assert.ok(workerHardening.includes("process_content_notification_queue"));

  assert.ok(supportAi.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(supportAi.includes("support_ai_config"));

  assert.ok(smoke.includes("Owner SELECT policy missing on"));
  assert.ok(smoke.includes("RUBI_QA_EXPECTED_SYSTEM_LEGACY_INSERT_DENIAL_NOT_RAISED"));
  assert.ok(smoke.includes("RUBI_QA_EXPECTED_SYSTEM_LEGACY_UPDATE_DENIAL_NOT_RAISED"));
  assert.ok(smoke.includes("RUBI_QA_EXPECTED_SYSTEM_LEGACY_DELETE_DENIAL_NOT_RAISED"));
});
