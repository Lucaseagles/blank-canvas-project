import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("social channel mutations cannot bypass the audited Owner RPC through direct table DML", () => {
  const migration = read("../../supabase/migrations/20261127180000_rubi_social_channel_dml_hardening.sql");
  const rpc = read("../../supabase/migrations/20261120220000_rubi_social_channel_atomic_audit.sql");
  const api = read("./social-cross-promo.functions.ts");

  assert.match(migration, /revoke insert, update, delete[\\s\\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant all on table public\\.social_channels to service_role/i);
  assert.match(migration, /Owners can view social channels/i);
  assert.match(rpc, /rubi_manage_social_channel_audited/);
  assert.match(rpc, /Owner authorization required/);
  assert.match(rpc, /insert into public\\.admin_audit_log/);
  assert.match(rpc, /revoke all on function public\\.rubi_manage_social_channel_audited/);
  assert.match(api, /rpc\\("rubi_manage_social_channel_audited"/);
  assert.doesNotMatch(api, /from\\("social_channels"\\)\\.(insert|update|delete|upsert)/);
});
