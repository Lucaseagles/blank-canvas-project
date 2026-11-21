import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("legacy Social Proof editor uses the shared atomic Owner settings RPC", () => {
  const api = read("./social-proof.functions.ts");
  const settings = read("./admin-settings.functions.ts");
  const ui = read("../routes/admin/social-proof.tsx");
  const sql = read("../../supabase/migrations/20261120230000_rubi_social_proof_settings_allowlist.sql");
  const update = api.slice(api.indexOf("export const updateSocialProofConfig"), api.indexOf("export const updateSocialProofOptOut"));
  assert.match(update, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(update, /rpc\("rubi_update_admin_setting_audited"/);
  assert.match(update, /p_source:"social_proof_config"/);
  assert.match(update, /p_actor:context\.userId/);
  assert.match(update, /p_expected:data\.expected/);
  assert.doesNotMatch(update, /\.from\("social_proof_config"\)\.update\(/);
  assert.match(ui, /patch: formData, expected: config/);
  assert.match(ui, /show_location: \(config as any\)\.show_location/);
  assert.match(settings, /"min_interval_seconds", "recency_window_minutes"/);
  assert.match(sql, /when 'social_proof_config' then array/);
  assert.match(sql, /'min_interval_seconds','recency_window_minutes'/);
  assert.match(sql, /Configuration changed; reload before saving/);
  assert.match(sql, /for update/);
  assert.match(sql, /RUBI_ADMIN_SETTING_UPDATED/);
  assert.match(sql, /values_redacted/);
  assert.match(sql, /to service_role/);
});

test("Social Proof public reads, user opt-out and analytics remain separate from Owner config writes", () => {
  const api = read("./social-proof.functions.ts");
  assert.match(api, /getSocialProofEvents/);
  assert.match(api, /getSocialProofPublicConfig/);
  assert.match(api, /updateSocialProofOptOut/);
  assert.match(api, /requireSupabaseAuth/);
  assert.match(api, /getAggregatedSocialProof/);
});
