import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const migration = readFileSync(new URL("../../supabase/migrations/20260922005336_d46a1b61-fdba-47d0-ae4f-77a4c51a8f0d.sql", import.meta.url), "utf8");
const triggerMigration = readFileSync(new URL("../../supabase/migrations/20260826030832_081214de-65bb-4f27-ada5-9e39babfcafa.sql", import.meta.url), "utf8");
const adminMigration = readFileSync(new URL("../../supabase/migrations/20260909001332_bfe38b06-238c-4983-91b5-08671bc4b254.sql", import.meta.url), "utf8");

test("profile trigger prevents self-service changes to protected identity and referral fields", () => {
  for (const field of ["user_id", "role", "is_banned", "current_tier_id", "total_referrals"]) {
    assert.match(migration, new RegExp("NEW\\." + field + "\\s+IS DISTINCT FROM OLD\\." + field, "i"), field + " must be immutable to ordinary users");
  }
  assert.match(migration, /auth\.uid\(\)\s+IS NULL\s+OR\s+public\.has_role\(auth\.uid\(\),\s*'owner'\)/i);
  assert.match(triggerMigration, /CREATE TRIGGER tr_prevent_profile_role_change[\s\S]*?BEFORE UPDATE ON public\.profiles[\s\S]*?EXECUTE FUNCTION public\.prevent_profile_role_change\(\)/i);
});

test("administrative ban operation is owner-gated, audited and server-only", () => {
  assert.match(adminMigration, /admin_set_profile_banned[\s\S]*?has_role\(auth\.uid\(\),'owner'\)/i);
  assert.match(adminMigration, /USER_BAN_STATUS_CHANGED/);
  assert.match(adminMigration, /REVOKE EXECUTE ON FUNCTION public\.admin_set_profile_banned\(uuid, boolean, uuid\) FROM PUBLIC, anon, authenticated/i);
  assert.match(adminMigration, /GRANT EXECUTE ON FUNCTION public\.admin_set_profile_banned\(uuid, boolean, uuid\) TO service_role/i);
});

test("administrative user listing and count RPCs are not callable by browser roles", () => {
  for (const fn of ["admin_count_users(text, boolean)", "admin_list_users(integer, integer, text, boolean)"]) {
    assert.match(adminMigration, new RegExp("REVOKE EXECUTE ON FUNCTION public\\." + fn.replace(/[()]/g, "\\$&") + " FROM PUBLIC, anon, authenticated", "i"));
    assert.match(adminMigration, new RegExp("GRANT EXECUTE ON FUNCTION public\\." + fn.replace(/[()]/g, "\\$&") + " TO service_role", "i"));
  }
});
