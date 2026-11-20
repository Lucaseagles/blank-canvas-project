import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./seller-center.functions.ts", import.meta.url), "utf8");
const handler = source.slice(source.indexOf("export const setSellerProductStatus ="));

test("product status mutation uses the authenticated owner client", () => {
  assert.match(handler, /\.middleware\(\[requireOwnerRole\]\)/);
  assert.match(handler, /context[.]supabase/);
  assert.match(handler, /[.]from\\("products"\\)/);
  assert.doesNotMatch(handler, /supabaseAdmin/);
});

test("status update is compare-and-set for nullable and non-null legacy values", () => {
  assert.match(handler, /current\.status === null/);
  assert.match(handler, /\.is\("status", null\)/);
  assert.match(handler, /\.eq\("status", current\.status\)/);
  assert.match(handler, /\.select\("id,status"\)\.maybeSingle\(\)/);
  assert.match(handler, /mudou em paralelo/);
});

test("audit is delegated to the existing database trigger in the same transaction", () => {
  assert.match(handler, /auth\.uid\(\).*audit trigger|auth\.uid\(\) is available to the[\s\S]*audit trigger/i);
  assert.doesNotMatch(handler, /append_admin_audit/);
  assert.match(handler, /do not append a second audit row/i);
});

test("no-op status changes do not create duplicate audit events", () => {
  assert.match(handler, /current\.status === data\.status/);
  assert.match(handler, /changed: false/);
});
