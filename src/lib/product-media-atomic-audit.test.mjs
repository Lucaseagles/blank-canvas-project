import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Product gallery changes use the Owner-gated atomic audit RPC instead of browser DML", () => {
  const api = read("./product-media.functions.ts");
  const ui = read("../components/product/ProductMediaAdminForm.tsx");
  const migration = read("../../supabase/migrations/20261127120000_rubi_product_media_atomic_audit.sql");
  assert.match(api, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(api, /p_actor:\s*context\.userId/);
  assert.match(api, /rpc\("rubi_update_product_images_audited"/);
  assert.match(api, /expectedUpdatedAt:[\s\S]*datetime/);
  assert.match(ui, /updateProductImagesAudited/);
  assert.doesNotMatch(ui, /from\(['"]products['"]\)\.update/);
  for (const token of [
    "security definer", "set search_path = ''", "Owner access required",
    "for update", "p_expected_updated_at", "RUBI_PRODUCT_MEDIA_IMAGES_UPDATED",
    "insert into public.admin_audit_log", "image_count",
    "Published products must retain at least one image",
    "revoke all on function", "to service_role"
  ]) assert.ok(migration.toLowerCase().includes(token.toLowerCase()), token);
  assert.doesNotMatch(migration, /jsonb_build_object\([^;]*image_url/i);
});

test("Gallery inputs are capped and require HTTP(S) URLs", () => {
  const api = read("./product-media.functions.ts");
  const ui = read("../components/product/ProductMediaAdminForm.tsx");
  assert.match(api, /images: z\.array\(z\.string\(\)\.url\(\)\.max\(2000\)\)\.max\(30\)/);
  assert.match(ui, /images\.length >= 30/);
  assert.match(ui, /http:.*https:/);
});
