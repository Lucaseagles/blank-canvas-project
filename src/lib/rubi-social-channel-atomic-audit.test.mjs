import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("social channel create, update and delete are Owner-gated and audited in one transaction", () => {
  const api = read("./social-cross-promo.functions.ts");
  const sql = read("../../supabase/migrations/20261120220000_rubi_social_channel_atomic_audit.sql");
  const save = api.slice(api.indexOf("export const saveSocialChannel"), api.indexOf("export const deleteSocialChannel"));
  const remove = api.slice(api.indexOf("export const deleteSocialChannel"), api.indexOf("export const getCrossPromoAnalytics"));
  for (const section of [save, remove]) {
    assert.match(section, /middleware\(\[requireOwnerRole\]\)/);
    assert.match(section, /rpc\("rubi_manage_social_channel_audited"/);
    assert.match(section, /p_actor: context\.userId/);
    assert.doesNotMatch(section, /\.insert\(|\.update\(|\.delete\(/);
  }
  for (const token of [
    "security invoker", "set search_path=''", "Owner authorization required",
    "for update", "RUBI_SOCIAL_CHANNEL_CREATED", "RUBI_SOCIAL_CHANNEL_UPDATED",
    "RUBI_SOCIAL_CHANNEL_DELETED", "insert into public.admin_audit_log",
    "sanitize_admin_audit_value", "revoke all on function public.rubi_manage_social_channel_audited",
    "to service_role", "channel_url_host", "p_action is null"
  ]) assert.ok(sql.includes(token), token);
  assert.match(api, /getActiveSocialChannels/);
  assert.match(api, /trackFollowIntent/);
  assert.match(api, /FOLLOW_CLICK/);
});
