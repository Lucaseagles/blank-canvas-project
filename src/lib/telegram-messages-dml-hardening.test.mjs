import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Telegram outbox table is Owner-read-only and all writes use audited server RPCs", () => {
  const migration = read("../../supabase/migrations/20261127220000_rubi_telegram_messages_dml_hardening.sql");
  const outbox = read("../../supabase/migrations/20261127170000_rubi_telegram_manual_send_outbox.sql");
  const api = read("./telegram.functions.ts");
  const smoke = read("../../scripts/rubi-local-telegram-send-outbox-smoke.sql");

  assert.match(migration, /drop policy if exists "Admins manage telegram messages"/i);
  assert.match(migration, /create policy "Admins can view telegram messages"[\\s\\S]*for select[\\s\\S]*to authenticated/i);
  assert.match(migration, /revoke all privileges[\\s\\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant select[\\s\\S]*to authenticated/i);
  assert.match(migration, /grant all privileges[\\s\\S]*to service_role/i);

  assert.match(outbox, /create or replace function public\\.rubi_prepare_telegram_send_audited/i);
  assert.match(outbox, /create or replace function public\\.rubi_finalize_telegram_send_audited/i);
  assert.match(outbox, /revoke all on function public\\.rubi_prepare_telegram_send_audited[\\s\\S]*from public, anon, authenticated/i);
  assert.match(outbox, /revoke all on function public\\.rubi_finalize_telegram_send_audited[\\s\\S]*from public, anon, authenticated/i);

  assert.match(api, /rubi_prepare_telegram_send_audited/);
  assert.match(api, /rubi_finalize_telegram_send_audited/);
  assert.doesNotMatch(api, /from\\(["']telegram_messages["']\\)\\.(insert|update|delete|upsert)/i);

  assert.match(smoke, /has_table_privilege\\('authenticated',[\\s\\S]*'INSERT'/i);
  assert.match(smoke, /RUBI_QA_EXPECTED_TELEGRAM_DIRECT_INSERT_DENIAL_NOT_RAISED/);
  assert.match(smoke, /RUBI_QA_EXPECTED_TELEGRAM_DIRECT_UPDATE_DENIAL_NOT_RAISED/);
  assert.match(smoke, /RUBI_QA_EXPECTED_TELEGRAM_DIRECT_DELETE_DENIAL_NOT_RAISED/);
  assert.match(smoke, /Non-Owner can read Telegram outbox history/);
});
