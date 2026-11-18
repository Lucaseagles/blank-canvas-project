import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const migrationDir = new URL("../../supabase/migrations/", import.meta.url);
const names = readdirSync(migrationDir).filter((name) => /^\d+_.+\.sql$/.test(name));
const versions = names.map((name) => name.split("_", 1)[0]);

test("all Supabase migration version identifiers are unique", () => {
  const duplicates = versions.filter((version, index) => versions.indexOf(version) !== index);
  assert.deepEqual([...new Set(duplicates)], []);
});

test("the applied Sprint 234 migration is represented by its database version", () => {
  const path = new URL("../../supabase/migrations/20261118001747_rubi_profile_privilege_hardening_sprint234.sql", import.meta.url);
  const sql = readFileSync(path, "utf8");
  assert.match(sql, /revoke all privileges on table public\.profiles/);
  assert.match(sql, /grant select, insert, update on table public\.user_preferences to authenticated/);
});

test("recent migration sequence preserves chronological order without collisions", () => {
  const expected = [
    "20261118001747_rubi_profile_privilege_hardening_sprint234.sql",
    "20261118010100_rubi_video_launch_atomic_audit.sql",
    "20261118020100_rubi_editorial_session_journey_uuid_fix.sql",
    "20261118020200_rubi_scheduled_post_worker_atomic_audit.sql",
    "20261118030000_rubi_partner_payout_atomic_audit.sql",
    "20261118040000_rubi_partner_partial_payouts.sql",
    "20261118050000_rubi_financial_domain_core_sprint252.sql",
  ];
  for (const name of expected) assert.ok(names.includes(name), name);
});
