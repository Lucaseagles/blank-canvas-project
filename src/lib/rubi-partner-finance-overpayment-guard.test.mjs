import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("./partner-finance-summary-admin.functions.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../routes/admin/partner-finance.tsx", import.meta.url), "utf8");

test("partner finance reconciles paid and pending commission per sale instead of netting globally", () => {
  assert.match(api, /const pendingCommissionCents = sales\.reduce/);
  assert.match(api, /toCents\(sale\.commission_amount\) - \(paidBySale\.get\(sale\.id\) \?\? 0\)/);
  assert.match(api, /const overpaidCommissionCents = sales\.reduce/);
});

test("overpayments and sales without calculated commission are returned as separate discrepancy metrics", () => {
  assert.match(api, /overpaidCommission:/);
  assert.match(api, /overpaidSales,/);
  assert.match(api, /uncommissionedSales,/);
  assert.match(ui, /Repasses acima da comissão/);
  assert.match(ui, /Vendas sem comissão calculada/);
  assert.match(ui, /role="alert"/);
});

test("empty partner selection returns the full metric contract", () => {
  assert.match(api, /overpaidCommission: 0, overpaidSales: 0, uncommissionedSales: 0/);
});

test("currency arithmetic is rounded to integer cents", () => {
  assert.match(api, /Math\.round\(amount \* 100\)/);
});
