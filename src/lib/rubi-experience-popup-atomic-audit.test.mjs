import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Experience Engine Owner updates use the shared atomic audited settings RPC", () => {
  const api = read("./experience-popup.functions.ts");
  const route = read("../routes/admin/experience-popup.tsx");
  const sql = read("../../supabase/migrations/20261113123000_rubi_admin_setting_atomic_audit.sql");
  const update = api.slice(api.indexOf("export const updateExperiencePopup"));

  assert.match(update, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(update, /expected:\s*z\.record\(z\.string\(\),\s*z\.unknown\(\)\)/);
  assert.match(update, /rpc\("rubi_update_admin_setting_audited"/);
  assert.match(update, /p_source:\s*"popup_rules"/);
  assert.match(update, /p_actor:\s*context\.userId/);
  assert.match(update, /p_expected:\s*data\.expected/);
  assert.doesNotMatch(update, /\.from\("popup_rules"\)\.update\(/);
  assert.match(route, /patch, expected:\s*rule/);
  assert.match(sql, /when 'popup_rules' then array/);
  assert.match(sql, /'priority','cooldown_minutes','frequency_cap_per_day'/);
  assert.match(sql, /for update/);
  assert.match(sql, /insert into public\.admin_audit_log/);
  assert.match(sql, /values_redacted/);
});

test("Experience Engine keeps its existing date validation and owner-only read boundary", () => {
  const api = read("./experience-popup.functions.ts");
  assert.match(api, /getExperiencePopupAdmin[\s\S]*middleware\(\[requireOwnerRole\]\)/);
  assert.match(api, /new Date\(data\.patch\.ends_at\) <= new Date\(data\.patch\.starts_at\)/);
});
