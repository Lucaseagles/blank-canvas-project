import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Telegram metric collection writes metric and audit through one atomic RPC", () => {
  const api = read("./connectors.functions.ts");
  const start = api.indexOf("export const collectTelegramMetric");
  const section = api.slice(start);
  assert.ok(section.includes('rpc("rubi_record_telegram_metric_audited"'));
  assert.ok(section.includes("p_channel_id: channel.id"));
  assert.ok(section.includes("p_value: result.result"));
  assert.ok(section.includes("p_actor: context.userId"));
  assert.ok(!section.includes('.from("external_channel_metrics").insert'));
  assert.ok(!section.includes('.from("admin_audit_log").insert'));
  assert.ok(section.includes("channels.length !== 1"));
});

test("Telegram metric RPC is owner-gated and rolls back metric if audit insert fails", () => {
  const sql = read("../../supabase/migrations/20261117143000_rubi_telegram_metric_atomic_audit.sql");
  for (const token of [
    "security invoker", "set search_path=''", "Owner authorization required",
    "from public.user_roles", "platform='telegram' and is_active=true",
    "for share", "insert into public.external_channel_metrics",
    "insert into public.admin_audit_log", "TELEGRAM_METRIC_COLLECTED",
    "revoke all on function public.rubi_record_telegram_metric_audited",
    "to service_role",
  ]) assert.ok(sql.includes(token), token);
});
