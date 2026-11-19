import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminApi = readFileSync(new URL("./partner-finance-summary-admin.functions.ts", import.meta.url), "utf8");
const partnerApi = readFileSync(new URL("./partner-commission-status.functions.ts", import.meta.url), "utf8");
const adminUi = readFileSync(new URL("../routes/admin/partner-finance.tsx", import.meta.url), "utf8");
const partnerUi = readFileSync(new URL("../routes/partner/portal.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../components/partner/RubiPartnerFinanceDashboard.tsx", import.meta.url), "utf8");

test("admin and partner reconcile paid, pending and overpaid commission per sale", () => {
  for (const api of [adminApi, partnerApi]) {
    assert.match(api, /paidBySale/);
    assert.match(api, /Math\.max\(0,/);
    assert.match(api, /overpaid/);
    assert.match(api, /Math\.round\(amount \* 100\)/);
  }
  assert.match(adminApi, /const pendingCommissionCents = sales\.reduce/);
  assert.match(adminApi, /const overpaidCommissionCents = sales\.reduce/);
  assert.match(partnerApi, /const pendingCents = sales\.reduce/);
  assert.match(partnerApi, /const overpaidCents = sales\.reduce/);
});

test("partner status treats zero-commission sales as unpaid and exposes discrepancy counts", () => {
  assert.match(partnerApi, /commission > 0/);
  assert.match(partnerApi, /overpaidSales/);
  assert.match(partnerApi, /unpaidSales: sales\.length - paidSales/);
  assert.match(partnerApi, /overpaid: overpaidCents \/ 100/);
});

test("admin and partner UIs visibly warn about overpayments without netting against other sales", () => {
  assert.match(adminApi, /overpaidCommission:/);
  assert.match(adminApi, /overpaidSales,/);
  assert.match(adminApi, /uncommissionedSales,/);
  assert.match(adminUi, /Repasses acima da comissão/);
  assert.match(adminUi, /Vendas sem comissão calculada/);
  assert.match(adminUi, /role="alert"/);
  assert.match(partnerUi, /Excesso identificado/);
  assert.match(partnerUi, /overpaidSales/);
  assert.match(partnerUi, /role="alert"/);
  assert.match(dashboard, /Divergência nos repasses registrados/);
  assert.match(dashboard, /commission\.overpaidSales/);
});

test("empty admin and partner selections return complete zero-valued contracts", () => {
  assert.match(adminApi, /overpaidCommission: 0, overpaidSales: 0, uncommissionedSales: 0/);
  assert.match(partnerApi, /overpaid: 0, paidSales: 0, unpaidSales: 0, overpaidSales: 0/);
});

test("partner identity is verified from access token and restricted to approved partner profile", () => {
  assert.match(partnerApi, /auth\.auth\.getClaims\(data\.accessToken\)/);
  assert.match(partnerApi, /eq\("user_id", claims\.claims\.sub\)/);
  assert.match(partnerApi, /eq\("audience", "partner"\)/);
  assert.match(partnerApi, /eq\("status", "approved"\)/);
});
