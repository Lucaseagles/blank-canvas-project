import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("./telegram.functions.ts");
const page = read("../routes/admin/telegram.tsx");
const migration = read("../../supabase/migrations/20261127170000_rubi_telegram_manual_send_outbox.sql");
const smoke = read("../../scripts/rubi-local-telegram-send-outbox-smoke.sql");

test("manual and test sends use the same Owner-attributed audited outbox", () => {
  assert.match(api, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(api, /rubi_prepare_telegram_send_audited/);
  assert.match(api, /rubi_finalize_telegram_send_audited/);
  assert.match(api, /p_actor:\s*input\.actorId/);
  assert.match(api, /messageKind:\s*"manual"/);
  assert.match(api, /messageKind:\s*"test"/);
  assert.doesNotMatch(api, /from\('telegram_messages'\)\.insert/);
});

test("outbox is idempotent and never blindly retries ambiguous delivery", () => {
  assert.match(migration, /unique index[\s\S]*telegram_messages_operation_key_uidx/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /Telegram idempotency key payload mismatch/);
  assert.match(api, /p_status:\s*"unknown"/);
  assert.match(api, /network_unknown/);
  assert.match(api, /response_invalid/);
  assert.match(page, /sendOperationKey/);
  assert.match(page, /status === "unknown"/);
});

test("outbox records start and completion audit in the same transaction", () => {
  assert.match(migration, /TELEGRAM_MESSAGE_SEND_STARTED/);
  assert.match(migration, /TELEGRAM_MESSAGE_SEND_FINISHED/);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /revoke all on function public\.rubi_prepare_telegram_send_audited[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.rubi_prepare_telegram_send_audited[\s\S]*to service_role/i);
  assert.match(migration, /revoke all on function public\.rubi_finalize_telegram_send_audited[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.rubi_finalize_telegram_send_audited[\s\S]*to service_role/i);
  assert.match(smoke, /RUBI_QA_FORCED_TELEGRAM_AUDIT_FAILURE/);
  assert.match(smoke, /rubi.qa.merchant_id/);
  assert.match(smoke, /rubi.qa.partner_id/);
});
