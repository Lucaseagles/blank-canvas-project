import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Master coupon writes use the Owner-gated atomic audit RPC, never browser DML", () => {
  const api = read("./customer-coupons-admin.functions.ts");
  const ui = read("../components/admin/coupons/CouponAdmin.tsx");
  const migration = read("../../supabase/migrations/20261127100000_rubi_customer_coupons_atomic_audit.sql");
  assert.match(api, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(api, /p_actor:\s*context\.userId/);
  assert.match(api, /rpc\("rubi_manage_customer_coupon_audited"/);
  assert.match(ui, /manageCustomerCouponAdmin/);
  assert.doesNotMatch(ui, /from\("customer_coupons"\)\.(?:insert|update|delete)/);
  for (const action of ["create", "update", "toggle", "delete"]) assert.ok(api.includes(`action: z.literal("${action}")`));
  for (const token of [
    "security definer", "Owner access required", "for update",
    "p_expected_updated_at", "insert into public.admin_audit_log",
    "RUBI_CUSTOMER_COUPON_CREATED", "RUBI_CUSTOMER_COUPON_UPDATED",
    "RUBI_CUSTOMER_COUPON_STATUS_CHANGED", "RUBI_CUSTOMER_COUPON_DELETED",
    "revoke all on function public.rubi_manage_customer_coupon_audited",
    "to service_role", "revoke insert, update, delete on public.customer_coupons"
  ]) assert.ok(migration.toLowerCase().includes(token.toLowerCase()), token);
});

test("coupon mutation payload cannot edit usage counters or bypass real-coupon enforcement", () => {
  const api = read("./customer-coupons-admin.functions.ts");
  const migration = read("../../supabase/migrations/20261127100000_rubi_customer_coupons_atomic_audit.sql");
  assert.doesNotMatch(api, /used_count/);
  assert.match(migration, /true,\s*nullif\(p_payload->>'product_id'/);
  assert.match(migration, /is_real = true/);
  assert.match(migration, /p_expected_updated_at is not null/);
});
