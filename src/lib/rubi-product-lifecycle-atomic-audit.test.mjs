import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("admin product create, edit and duplicate use the Owner-gated audited lifecycle RPC", () => {
  const api = read("./product-lifecycle.functions.ts");
  const form = read("../admin/products/ProductForm.tsx");
  const duplicate = read("../admin/products/ProductDuplicate.tsx");
  const legacy = read("./supabase/products.ts");
  const sql = read("../../supabase/migrations/20261120210000_rubi_product_lifecycle_atomic_audit.sql");
  for (const fn of ["saveCatalogProduct", "duplicateCatalogProduct"]) {
    const start = api.indexOf("export const " + fn);
    const end = api.indexOf("\nexport const ", start + 1);
    const section = api.slice(start, end < 0 ? undefined : end);
    assert.match(section, /middleware\(\[requireOwnerRole\]\)/, fn);
    assert.match(section, /rpc\("rubi_manage_catalog_product_audited"/, fn);
    assert.match(section, /p_actor: context\.userId/, fn);
  }
  assert.match(form, /saveCatalogProduct/);
  assert.doesNotMatch(form, /createProduct\(|updateProduct\(/);
  assert.match(duplicate, /duplicateCatalogProduct/);
  assert.doesNotMatch(duplicate, /duplicateProduct\(/);
  assert.doesNotMatch(legacy, /export async function (createProduct|updateProduct|duplicateProduct)\(/);
  assert.doesNotMatch(legacy, /\.from\("products"\)\s*\.(insert|update|delete)\(/);
  for (const token of [
    "security invoker", "set search_path=''", "Owner authorization required",
    "for update", "for share", "RUBI_PRODUCT_CREATED", "RUBI_PRODUCT_UPDATED",
    "RUBI_PRODUCT_DUPLICATED", "insert into public.admin_audit_log",
    "revoke all on function public.rubi_manage_catalog_product_audited",
    "to service_role", "p_action is null", "status", "free_shipping", "images", "image_count", "affiliate_host"
  ]) assert.ok(sql.includes(token), token);
});
