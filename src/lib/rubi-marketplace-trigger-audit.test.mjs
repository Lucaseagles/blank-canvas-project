import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql = readFileSync(new URL("../../supabase/migrations/20261117160000_rubi_marketplace_trigger_audit_hardening.sql", import.meta.url), "utf8");

test("marketplace trigger uses non-null JSON snapshots and redacts api_config", () => {
  assert.ok(sql.includes("current_setting('rubi.marketplace_atomic_audit',true)='on'"));
  assert.ok(sql.includes("to_jsonb(new)-'api_config'"));
  assert.ok(sql.includes("to_jsonb(old)-'api_config'"));
  assert.ok(sql.includes("coalesce(v_previous,'{}'::jsonb)"));
  assert.ok(sql.includes("coalesce(v_new,'{}'::jsonb)"));
});

test("atomic marketplace RPC suppresses duplicate trigger audit only inside its transaction", () => {
  assert.ok(sql.includes("perform set_config('rubi.marketplace_atomic_audit','on',true)"));
  assert.ok(sql.includes("MARKETPLACE_CREATED"));
  assert.ok(sql.includes("MARKETPLACE_UPDATED"));
  assert.ok(sql.includes("MARKETPLACE_DELETED"));
  assert.ok(sql.includes("MARKETPLACE_CREDENTIALS_UPDATED"));
});
