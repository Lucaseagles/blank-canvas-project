import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("generic Admin Settings tables are Owner-read-only and mutations stay on audited RPCs", () => {
  const migration = read("../../supabase/migrations/20261127230000_rubi_admin_settings_dml_hardening.sql");
  const genericAudit = read("../../supabase/migrations/20261113123000_rubi_admin_setting_atomic_audit.sql");
  const telegramAudit = read("../../supabase/migrations/20261126113000_rubi_telegram_config_atomic_audit.sql");
  const settingsApi = read("./admin-settings.functions.ts");
  const telegramApi = read("./telegram.functions.ts");
  const smoke = read("../../scripts/rubi-local-admin-settings-dml-hardening-smoke.sql");

  const tables = [
    "app_points_config", "automation_rules", "banners", "compliance_rules",
    "feature_flags", "feed_mix_config", "personalization_weights",
    "social_proof_config", "telegram_config", "whatsapp_config",
  ];
  for (const table of tables) {
    assert.ok(migration.includes("public." + table), table);
    assert.ok(migration.includes("public." + table + " is"), table);
  }

  assert.ok(migration.includes("to_regclass('public.feature_flags') is not null"));
  assert.ok(migration.includes("revoke all privileges on table"));
  assert.ok(migration.includes("from public, anon, authenticated"));
  assert.ok(migration.includes("grant all privileges on table"));
  assert.ok(migration.includes("to service_role"));
  assert.ok(migration.includes("grant select on table public.banners to anon"));
  assert.ok(!migration.includes('drop policy if exists "Allow public read-only access to active banners"'));

  for (const policy of [
    '"Owners can view points config"',
    '"Owners can view automation rules"',
    '"Owners can view banners"',
    '"Owners can view compliance rules"',
    "feature_flags_owner_select",
    '"Owners can view feed mix config"',
    '"Owners can view personalization weights"',
    '"Owners can view social proof config"',
    '"Owners can view telegram config"',
    "whatsapp_config_admin_insert",
    "whatsapp_config_admin_update",
  ]) assert.ok(migration.includes(policy), policy);

  assert.ok(genericAudit.includes("rubi_update_admin_setting_audited"));
  assert.ok(genericAudit.includes("revoke all on function public.rubi_update_admin_setting_audited"));
  assert.ok(telegramAudit.includes("rubi_save_telegram_config_audited"));
  assert.ok(telegramAudit.includes("revoke all on function public.rubi_save_telegram_config_audited"));
  assert.ok(settingsApi.includes("rubi_update_admin_setting_audited"));
  assert.ok(telegramApi.includes("rubi_save_telegram_config_audited"));

  assert.ok(smoke.includes("to_regclass('public.feature_flags') is not null"));
  assert.ok(smoke.includes("RUBI_QA_EXPECTED_ADMIN_SETTINGS_INSERT_DENIAL_NOT_RAISED"));
  assert.ok(smoke.includes("RUBI_QA_EXPECTED_ADMIN_SETTINGS_UPDATE_DENIAL_NOT_RAISED"));
  assert.ok(smoke.includes("RUBI_QA_EXPECTED_ADMIN_SETTINGS_DELETE_DENIAL_NOT_RAISED"));
  assert.ok(smoke.includes("Public active-banner RLS policy was not preserved"));
  assert.ok(smoke.includes("Non-Owner can read Owner-only app points configuration"));
});
