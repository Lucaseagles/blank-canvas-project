import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260907165701_restore_profile_referral_consent_fields.sql", import.meta.url),
  "utf8",
);

test("profile referral and consent columns exist before admin RPCs and privilege grants", () => {
  for (const column of [
    "total_referrals integer NOT NULL DEFAULT 0",
    "current_tier_id uuid",
    "is_banned boolean NOT NULL DEFAULT false",
    "show_on_leaderboard boolean NOT NULL DEFAULT false",
    "whatsapp_opt_in boolean NOT NULL DEFAULT false",
    "whatsapp_opt_in_at timestamptz",
    "whatsapp_opt_in_source text",
  ]) assert.ok(migration.includes(column), `missing profile field: ${column}`);

  assert.match(migration, /REFERENCES public\.referral_tiers\(id\) ON DELETE SET NULL/i);
  assert.match(migration, /SECURITY INVOKER[\s\S]*SET search_path = ''/i);
  assert.match(migration, /WHERE profile\.user_id = auth\.uid\(\)/i);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.set_whatsapp_opt_in\(boolean, text\) FROM PUBLIC, anon/i);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.set_whatsapp_opt_in\(boolean, text\) TO authenticated/i);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.set_referral_leaderboard_visibility\(p_show boolean\)/i);
  assert.match(migration, /UPDATE public\.profiles[\s\S]*show_on_leaderboard = p_show[\s\S]*WHERE user_id = auth\.uid\(\)/i);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.set_referral_leaderboard_visibility\(boolean\) TO authenticated/i);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.get_referral_leaderboard\(limit_count integer DEFAULT 50\)/i);
  assert.match(migration, /profile\.show_on_leaderboard IS TRUE[\s\S]*profile\.is_banned IS FALSE[\s\S]*profile\.total_referrals > 0/i);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.get_referral_leaderboard_position\(p_user_id uuid\)/i);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.get_referral_leaderboard\(integer\) FROM PUBLIC, anon, authenticated/i);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.get_referral_leaderboard\(integer\) TO service_role/i);
});

test("WhatsApp consent defaults to opt-out and revocation clears the affirmative consent evidence", () => {
  assert.match(migration, /whatsapp_opt_in boolean NOT NULL DEFAULT false/i);
  assert.match(migration, /CASE WHEN p_enabled THEN now\(\) ELSE NULL END/i);
  assert.match(migration, /WHEN p_enabled THEN NULLIF\(left\(btrim\(p_source\), 120\), ''\)[\s\S]*ELSE NULL/i);
});
