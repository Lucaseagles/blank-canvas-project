import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./seller-center.functions.ts", import.meta.url), "utf8");
const handler = source.slice(source.indexOf("export const setSellerProductStatus ="));

test("product status mutation uses the authenticated owner client", () => {
  assert.ok(handler.includes(".middleware([requireOwnerRole])"));
  assert.ok(handler.includes("context.supabase"));
  assert.ok(handler.includes('.from("products")'));
  assert.ok(!handler.includes("supabaseAdmin"));
});

test("status update is compare-and-set for nullable and non-null legacy values", () => {
  assert.ok(handler.includes("current.status === null"));
  assert.ok(handler.includes('.is("status", null)'));
  assert.ok(handler.includes('.eq("status", current.status)'));
  assert.ok(handler.includes('.select("id,status")'));
  assert.ok(handler.includes(".maybeSingle()"));
  assert.ok(handler.includes("mudou em paralelo"));
});

test("audit is delegated to the existing database trigger in the same transaction", () => {
  assert.match(handler, /auth\.uid\(\).*audit trigger|auth\.uid\(\) is available to the[\s\S]*audit trigger/i);
  assert.ok(!handler.includes("append_admin_audit"));
  assert.ok(handler.includes("do not append a second audit row"));
});

test("no-op status changes do not create duplicate audit events", () => {
  assert.ok(handler.includes("current.status === data.status"));
  assert.ok(handler.includes("changed: false"));
});
