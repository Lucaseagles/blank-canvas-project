import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
test("manual reconciliation requires source evidence and server-validated verification time", () => {
 const api = read("./partner-sales-reconciliation-admin.functions.ts");
 const ui = read("../routes/admin/partner-sales.tsx");
 const sql = read("../../supabase/migrations/20261114060000_rubi_partner_manual_reconciliation_evidence.sql");
 for (const field of ["provider_name", "payment_evidence_reference", "payment_verified_at"]) {
  assert.ok(api.includes(field), "API requires " + field);
  assert.ok(ui.includes(field), "UI submits " + field);
  assert.ok(sql.includes(field), "DB persists " + field);
 }
 assert.match(api,/verifiedAt\.getTime\(\) > Date\.now\(\)/);
 assert.match(api,/requireOwnerRole/);
 assert.match(sql,/source <> 'admin_reconciliation'/);
 assert.match(sql,/not valid/i);
 assert.match(sql,/not proof of a provider-originated payment event/i);
 assert.match(api,/\.eq\("commercial_profile_id", link\.commercial_profile_id\)/);
});
