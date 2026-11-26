import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("Telegram configuration writes metadata, Vault secrets and audit through one Owner RPC", () => {
  const api = read("./telegram.functions.ts");
  const start = api.indexOf("export const saveTelegramConfig");
  const end = api.indexOf("\nexport const testTelegramConnection", start);
  const section = api.slice(start, end);
  assert.ok(section.includes('rpc("rubi_save_telegram_config_audited"'));
  assert.ok(section.includes("p_channel_id: data.channelId"));
  assert.ok(section.includes("p_is_active: data.isActive"));
  assert.ok(section.includes("p_bot_token: data.botToken ?? null"));
  assert.ok(section.includes("p_actor: context.userId"));
  assert.doesNotMatch(section, /\.from\(['"]telegram_config['"]\)\.(?:insert|update|upsert)/);
  assert.doesNotMatch(section, /set_integration_secret/);
  assert.ok(section.includes("getIntegrationSecretServer"));
  const generic = read("./admin-settings.functions.ts");
  assert.match(generic, /key: "telegram_config"[^\\n]*editable: \\[\\]/);
  assert.doesNotMatch(generic, /key: "telegram_config"[^\\n]*editable: \\["channel_id", "is_active"\\]/);
});

test("Telegram config RPC is transactional, Owner-gated, serialized and redacts secret values", () => {
  const sql = read("../../supabase/migrations/20261126113000_rubi_telegram_config_atomic_audit.sql");
  for (const token of [
    "security invoker", "set search_path = ''", "Owner authorization required",
    "pg_advisory_xact_lock", "public.set_integration_secret('telegram', 'channel_id'",
    "public.set_integration_secret('telegram', 'bot_token'",
    "insert into public.admin_audit_log", "RUBI_TELEGRAM_CONFIG_UPDATED",
    "channel_id_redacted", "channel_id_redacted", "bot_token_redacted",
    "revoke all on function public.rubi_save_telegram_config_audited",
    "from public, anon, authenticated", "to service_role",
  ]) assert.ok(sql.includes(token), token);
  assert.doesNotMatch(sql, /jsonb_build_object\([^)]*p_bot_token/i);
});

test("local disposable PostgreSQL smoke covers rollback, non-owner rejection, Vault persistence and audit", () => {
  const workflow = read("../../.github/workflows/rubi-local-authenticated-e2e.yml");
  const smoke = read("../../scripts/rubi-local-telegram-config-audit-smoke.sql");
  assert.ok(workflow.includes("rubi-local-telegram-config-audit-smoke.sql"));
  for (const token of [
    "RUBI_QA_FORCED_TELEGRAM_AUDIT_FAILURE",
    "Owner authorization required",
    "public.get_integration_secret",
    "RUBI_TELEGRAM_CONFIG_UPDATED",
    "values_redacted",
    "ROLLBACK;",
  ]) assert.ok(smoke.includes(token), token);
});
