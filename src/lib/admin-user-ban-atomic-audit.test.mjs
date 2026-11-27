import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const api = read("./admin-users.functions.ts");
const migration = read("../../supabase/migrations/20261127150000_rubi_admin_user_ban_atomic_audit.sql");
const handler = api.slice(api.indexOf("export const setUserBanned"));

test("admin ban server action is Owner-gated and passes the authenticated actor", () => {
  assert.match(handler, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(handler, /p_actor:\s*context\.userId/);
  assert.match(handler, /admin_set_profile_banned/);
});

test("database function verifies the supplied actor is an Owner even under service_role", () => {
  assert.match(migration, /v_actor is null or not exists\([\s\S]*r\.user_id = v_actor and r\.role::text = 'owner'/i);
  assert.match(migration, /auth\.uid\(\) is not null and auth\.uid\(\) is distinct from v_actor/i);
  assert.match(migration, /revoke all on function public\.admin_set_profile_banned\(uuid, boolean, uuid\)[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.admin_set_profile_banned\(uuid, boolean, uuid\)[\s\S]*to service_role/i);
});

test("ban mutation serializes the profile row and suppresses duplicate no-op audit events", () => {
  assert.match(migration, /where p\.user_id = p_user_id\s+for update/i);
  assert.match(migration, /if v_old_value is not distinct from p_banned then\s+return true/i);
  assert.match(migration, /update public\.profiles[\s\S]*insert into public\.admin_audit_log/i);
  assert.match(migration, /USER_BAN_STATUS_CHANGED/);
  assert.match(migration, /actor_user_id, actor_email, action_type, entity_type, entity_id/i);
});


test("user-ban audit supports both text and UUID entity_id schemas", () => {
  assert.match(migration, /format_type\(a\.atttypid, a\.atttypmod\)/i);
  assert.match(migration, /v_entity_id_type = 'uuid'/i);
  assert.match(migration, /v_entity_id_type = 'text'/i);
  assert.match(migration, /p_user_id::text/);
  const smoke = read("../../scripts/rubi-local-admin-user-ban-audit-smoke.sql");
  assert.match(smoke, /entity_id::text\s*=\s*v_user::text/);
  assert.match(smoke, /rubi.qa.merchant_id/);
  assert.match(smoke, /rubi.qa.partner_id/);
});

