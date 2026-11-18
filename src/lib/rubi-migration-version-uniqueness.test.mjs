import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const migrationDir = new URL("../../supabase/migrations/", import.meta.url);
const names = readdirSync(migrationDir).filter((name) => /^\d+_.+\.sql$/.test(name));
const rolloutNames = names.filter((name) => /^(20261117235530|20261118)/.test(name));
const rolloutVersions = rolloutNames.map((name) => name.split("_", 1)[0]);

test("the November 17-18 rollout migrations have unique version identifiers", () => {
  const duplicates = rolloutVersions.filter((version, index) => rolloutVersions.indexOf(version) !== index);
  assert.deepEqual([...new Set(duplicates)], []);
});

test("the already-applied Sprint 233 and Sprint 234 migrations match remote history versions", () => {
  const partnerGrants = readFileSync(new URL("../../supabase/migrations/20261117235530_rubi_partner_grants_server_only.sql", import.meta.url), "utf8");
  const profiles = readFileSync(new URL("../../supabase/migrations/20261118001747_rubi_profile_privilege_hardening_sprint234.sql", import.meta.url), "utf8");
  assert.match(partnerGrants, /revoke all privileges on table public\.hub_partner_product_grants/);
  assert.match(profiles, /revoke all privileges on table public\.profiles/);
  assert.match(profiles, /grant select, insert, update on table public\.user_preferences to authenticated/);
});

test("recent rollout sequence preserves applied and pending migration identities", () => {
  const expected = [
    "20261117235530_rubi_partner_grants_server_only.sql",
    "20261118001747_rubi_profile_privilege_hardening_sprint234.sql",
    "20261118010100_rubi_video_launch_atomic_audit.sql",
    "20261118020100_rubi_editorial_session_journey_uuid_fix.sql",
    "20261118020200_rubi_scheduled_post_worker_atomic_audit.sql",
    "20261118030000_rubi_partner_payout_atomic_audit.sql",
    "20261118040000_rubi_partner_partial_payouts.sql",
    "20261118050000_rubi_financial_domain_core_sprint252.sql",
    "20261118060000_rubi_finance_atomic_operations_sprint253.sql",
  ];
  for (const name of expected) assert.ok(rolloutNames.includes(name), name);
});
