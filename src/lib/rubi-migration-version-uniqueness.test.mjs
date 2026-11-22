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

test("Sprint 27 support and Sprint 33 search use distinct migration versions", () => {
  assert.ok(names.includes("20260901015000_sprint27_part3_support.sql"));
  assert.ok(names.includes("20260901020000_sprint33_search_and_recently_viewed.sql"));
  assert.ok(!names.includes("20260901020000_sprint27_part3_support.sql"));
});

test("all historical duplicate migration prefixes remain explicitly allowlisted", () => {
  // Historical duplicates are intentionally not renamed here: production migration
  // history contains deployed identities that cannot be inferred from filenames.
  // Any new duplicate or silent removal must trigger a deliberate reconciliation.
  const expectedHistoricalDuplicates = {
    "20260902000002": [
      "20260902000002_sprint34_secure_hub_platform_registry.sql",
      "20260902000002_sprint34_secure_hub_platforms.sql",
    ],
    "20260903000000": [
      "20260903000000_sprint36_worker_truthfulness.sql",
      "20260903000000_sprint37_categories_filters.sql",
    ],
    "20260911000000": [
      "20260911000000_sprint31_strategy_orchestrator.sql",
      "20260911000000_sprint40_opportunity_engine.sql",
    ],
    "20261114060000": [
      "20261114060000_rubi_creator_fit_review.sql",
      "20261114060000_rubi_partner_manual_reconciliation_evidence.sql",
    ],
    "20261114070000": [
      "20261114070000_rubi_b2b_tier_integrity.sql",
      "20261114070000_rubi_product_inline_atomic_audit.sql",
    ],
    "20261114080000": [
      "20261114080000_rubi_bulk_product_status_atomic.sql",
      "20261114080000_rubi_onboarding_quiz_atomic.sql",
    ],
    "20261114090000": [
      "20261114090000_rubi_movement_controlled_ab.sql",
      "20261114090000_rubi_scheduled_post_decision_atomic.sql",
    ],
  };

  const actual = Object.fromEntries(
    Object.entries(
      names.reduce((groups, name) => {
        const version = name.split("_", 1)[0];
        groups[version] ??= [];
        groups[version].push(name);
        return groups;
      }, {}),
    )
      .filter(([, files]) => files.length > 1)
      .map(([version, files]) => [version, files.sort()]),
  );

  assert.deepEqual(actual, expectedHistoricalDuplicates);
});
