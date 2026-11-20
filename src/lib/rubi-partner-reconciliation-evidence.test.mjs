import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("manual reconciliation requires documentary evidence and bounded server verification time", () => {
  const api = read("./partner-sales-reconciliation-admin.functions.ts");
  const ui = read("../routes/admin/partner-sales.tsx");
  const evidenceSchema = read("../../supabase/migrations/20261114060000_rubi_partner_manual_reconciliation_evidence.sql");
  const auditedRpc = read("../../supabase/migrations/20261115010000_rubi_partner_sale_reconciliation_atomic.sql");

  for (const field of ["provider_name", "payment_evidence_reference", "payment_verified_at"]) {
    assert.ok(api.includes(field), "API requires " + field);
    assert.ok(ui.includes(field), "UI submits " + field);
    assert.ok(evidenceSchema.includes(field), "DB persists " + field);
  }

  assert.ok(api.includes(".middleware([requireOwnerRole])"));
  assert.ok(api.includes("p_payment_verified_at: data.payment_verified_at"));
  assert.ok(evidenceSchema.includes("source <> 'admin_reconciliation'"));
  assert.ok(evidenceSchema.includes(") not valid;"));
  assert.ok(evidenceSchema.includes("not proof of a provider-originated payment event"));
  assert.match(auditedRpc, /p_payment_verified_at\s*>\s*now\(\)/);
  assert.match(auditedRpc, /p_payment_verified_at\s*<\s*now\(\)\s*-\s*interval\s+'366 days'/);
  assert.ok(auditedRpc.includes("Owner authorization required"));
  assert.ok(auditedRpc.includes("Active commercial agreement required"));
});
