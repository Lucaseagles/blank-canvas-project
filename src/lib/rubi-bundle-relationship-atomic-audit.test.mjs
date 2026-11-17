import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("bundle and relationship mutations use the Owner-only atomic RPC", () => {
  const api = read("./relationships.functions.ts");
  const server = read("./relationships.server.ts");
  assert.ok(api.includes('rpc("rubi_manage_bundle_audited"'));
  assert.ok(api.includes('manageBundle("save"'));
  assert.ok(api.includes('manageBundle("delete"'));
  assert.ok(api.includes('manageBundle("relationship_create"'));
  assert.ok(api.includes('manageBundle("relationship_delete"'));
  assert.ok(api.includes("p_actor: actor"));
  assert.ok(!server.includes(".from('bundles').insert"));
  assert.ok(!server.includes(".from('bundles').update"));
  assert.ok(!server.includes(".from('product_relationships').insert"));
  assert.ok(!server.includes(".from('product_relationships').delete"));
});

test("bundle RPC validates Owner, locks records, updates links and audits atomically", () => {
  const sql = read("../../supabase/migrations/20261117173000_rubi_bundle_relationship_atomic_audit.sql");
  for (const token of [
    "security invoker", "set search_path=''", "Owner authorization required",
    "for update", "for key share", "insert into public.bundle_products",
    "delete from public.bundle_products", "insert into public.product_relationships",
    "delete from public.product_relationships", "insert into public.admin_audit_log",
    "Invalid bundle product entry", "Duplicate product in bundle",
    "RUBI_BUNDLE_CREATED", "RUBI_BUNDLE_UPDATED", "RUBI_BUNDLE_DELETED",
    "RUBI_PRODUCT_RELATIONSHIP_CREATED", "RUBI_PRODUCT_RELATIONSHIP_DELETED",
    "revoke all on function public.rubi_manage_bundle_audited",
    "to service_role", "revoke insert,update,delete on public.bundles from authenticated",
    "revoke insert,update,delete on public.bundle_products from authenticated",
    "revoke insert,update,delete on public.product_relationships from authenticated",
  ]) assert.ok(sql.includes(token), token);
});
