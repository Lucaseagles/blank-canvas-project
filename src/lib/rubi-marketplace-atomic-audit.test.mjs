import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("marketplace CRUD routes use one Owner-gated transactional RPC", () => {
  const api = read("./marketplace.functions.ts");
  for (const name of ["saveAdminMarketplace", "deleteAdminMarketplace"]) {
    const start = api.indexOf(`export const ${name}`);
    const section = api.slice(start);
    assert.ok(section.includes("middleware([requireOwnerRole])"));
    assert.ok(section.includes('rpc("rubi_manage_marketplace_audited"'));
    assert.ok(section.includes("p_actor: context.userId"));
  }
  assert.ok(!api.includes('.from("marketplaces").insert'));
  assert.ok(!api.includes('.from("marketplaces").update'));
  assert.ok(!api.includes('.from("marketplaces").delete'));
  assert.ok(!api.includes('.from("admin_audit_log").insert'));
});

test("credentials and sync status use atomic audit without persisting secrets in the audit", () => {
  const api = read("./connectors.functions.ts");
  assert.ok(api.includes('p_action: "credentials"'));
  assert.ok(api.includes('p_action: "api_status"'));
  assert.ok(api.includes("rubi_manage_marketplace_audited"));
  const sql = read("../../supabase/migrations/20261117120000_rubi_marketplace_atomic_audit.sql");
  for (const token of ["credential_fields", "values_redacted", "insert into public.admin_audit_log",
    "security invoker", "Owner authorization required", "for update",
    "public.products p where p.marketplace_id=p_id", "revoke all on function public.rubi_manage_marketplace_audited",
    "to service_role"]) assert.ok(sql.includes(token), token);
});
