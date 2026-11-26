import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Master referral tier UI routes every mutation through protected server functions", () => {
  const ui = read("../admin/referral/ReferralTiersAdmin.tsx");
  const server = read("./referral-tiers-admin.functions.ts");
  assert.match(ui, /createAdminReferralTier/);
  assert.match(ui, /updateAdminReferralTier/);
  assert.match(ui, /deactivateAdminReferralTier/);
  assert.doesNotMatch(ui, /supabase\.(from|rpc)|\.insert\(|\.update\(|\.delete\(/);
  for (const name of ["getAdminReferralTiers","createAdminReferralTier","updateAdminReferralTier","deactivateAdminReferralTier"]) {
    const start = server.indexOf(`export const ${name}`);
    assert.notEqual(start, -1, name);
    const section = server.slice(start, server.indexOf("\n\nexport const ", start + 1) === -1 ? undefined : server.indexOf("\n\nexport const ", start + 1));
    assert.match(section, /middleware\(\[requireOwnerRole\]\)/, name);
  }
  for (const rpc of ["rubi_create_referral_tier_audited","rubi_update_referral_tier_audited","rubi_deactivate_referral_tier_audited"]) assert.ok(server.includes(rpc), rpc);
});

test("referral tier RPCs enforce Owner, optimistic concurrency, atomic sanitized audit and least privilege", () => {
  const sql = read("../../supabase/migrations/20261126100000_rubi_referral_tiers_atomic_audit.sql");
  for (const token of [
    "security invoker","set search_path=''","Owner authorization required",
    "insert into public.admin_audit_log","values_redacted",
    "for update","p_expected_updated_at","get diagnostics v_rows = row_count",
    "drop policy if exists \"Owners can manage referral tiers\"",
    "revoke insert, update, delete, truncate, references, trigger",
    "from anon, authenticated","to service_role"
  ]) assert.ok(sql.toLowerCase().includes(token.toLowerCase()), token);
  assert.equal((sql.match(/insert into public\.admin_audit_log/gi) || []).length, 3);
  assert.match(sql, /rubi_create_referral_tier_audited/);
  assert.match(sql, /rubi_update_referral_tier_audited/);
  assert.match(sql, /rubi_deactivate_referral_tier_audited/);
  assert.doesNotMatch(sql, /grant\s+(?:all|insert|update|delete)\s+on\s+public\.referral_tiers\s+to\s+(?:anon|authenticated)/i);
});

test("migration keeps consumer tier reads while removing legacy authenticated Owner writes", () => {
  const migration = read("../../supabase/migrations/20260907165700_restore_referral_tiers.sql");
  assert.match(migration, /Anyone can read active referral tiers/);
  assert.match(migration, /using\\s*\\(\\s*is_active\\s*=\\s*true\\s*\\)/);
  const audit = read("../../supabase/migrations/20261126100000_rubi_referral_tiers_atomic_audit.sql");
  assert.match(audit, /drop policy if exists "Owners can manage referral tiers"/);
  assert.match(audit, /revoke insert, update, delete, truncate, references, trigger\s+on public\.referral_tiers from anon, authenticated/i);
});

test("server validates every tier field and uses optimistic update timestamps", () => {
  const server = read("./referral-tiers-admin.functions.ts");
  assert.match(server, /tier_name: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(120\)/);
  assert.match(server, /tier_key: z\.string\(\)\.trim\(\)\.regex/);
  assert.match(server, /expectedUpdatedAt: z\.string\(\)\.datetime\(\{ offset: true \}\)\.nullable\(\)/);
  assert.match(server, /p_actor: context\.userId/);
  assert.doesNotMatch(server, /p_actor:.*data\./);
});
