import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const migration = readFileSync(new URL("../supabase/migrations/20261118010000_rubi_profile_privilege_hardening.sql", import.meta.url), "utf8");

test("profiles grants are least-privilege and preserve only self-service columns", () => {
  assert.match(migration, /revoke all privileges on table public\.profiles from public, anon, authenticated/i);
  assert.match(migration, /grant select on table public\.profiles to authenticated/i);
  assert.match(migration, /grant update\s*\([\s\S]*display_name[\s\S]*location_city[\s\S]*location_state[\s\S]*whatsapp_opt_in[\s\S]*show_on_leaderboard[\s\S]*updated_at[\s\S]*\) on table public\.profiles to authenticated/i);
  for (const forbidden of ["role", "is_banned", "total_referrals", "current_tier_id", "user_id"]) {
    assert.doesNotMatch(migration, new RegExp(`grant update\\s*\\([\\s\\S]*?\\b${forbidden}\\b[\\s\\S]*?\\) on table public\\.profiles`, "i"));
  }
});

test("user preferences preserve self-service read/create/update but remove delete and anon access", () => {
  assert.match(migration, /revoke all privileges on table public\.user_preferences from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update on table public\.user_preferences to authenticated/i);
  assert.doesNotMatch(migration, /grant [^;]*delete[^;]*user_preferences/i);
});

test("trusted service role access is not revoked", () => {
  assert.match(migration, /service_role grants are intentionally preserved/i);
});
