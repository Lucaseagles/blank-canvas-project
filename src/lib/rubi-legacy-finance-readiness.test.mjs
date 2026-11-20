import test from "node:test";
import assert from "node:assert/strict";
import { summarizeLegacyFinanceReadiness } from "./rubi-legacy-finance-readiness.ts";

test("empty legacy subledger is reported as empty, not as migrated or settled", () => {
  const result = summarizeLegacyFinanceReadiness({ sales: [], payoutItems: [], payouts: [] });
  assert.equal(result.status, "empty");
  assert.equal(result.migrationReady, false);
  assert.equal(result.bankVerifiedPayoutItems, 0);
});

test("legacy records without currency block migration instead of assuming BRL", () => {
  const result = summarizeLegacyFinanceReadiness({
    sales: [{ id: "sale-1", commission_amount: 12.5 }],
    payoutItems: [{ id: "item-1", payout_id: "payout-1", sale_id: "sale-1", commission_amount: 5 }],
    payouts: [{ id: "payout-1", payment_reference: "TX-123" }],
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.salesMissingCurrency, 1);
  assert.equal(result.payoutItemsMissingCurrency, 1);
  assert.equal(result.migrationReady, false);
  assert.equal(result.bankVerifiedPayoutItems, 0);
});

test("explicit currency and valid source references allow review, never automatic bank verification", () => {
  const result = summarizeLegacyFinanceReadiness({
    sales: [{ id: "sale-1", commission_amount: "12.50", currency: "BRL" }],
    payoutItems: [{ id: "item-1", payout_id: "payout-1", sale_id: "sale-1", commission_amount: "5.00", currency: "BRL" }],
    payouts: [{ id: "payout-1", payment_reference: "TX-123" }],
  });
  assert.equal(result.status, "review_required");
  assert.equal(result.migrationReady, true);
  assert.equal(result.bankVerifiedPayoutItems, 0);
});

test("orphan payout items block migration even when currency is explicit", () => {
  const result = summarizeLegacyFinanceReadiness({
    sales: [{ id: "sale-1", commission_amount: 12.5, currency: "BRL" }],
    payoutItems: [{ id: "item-1", payout_id: "missing", sale_id: "sale-1", commission_amount: 5, currency: "BRL" }],
    payouts: [],
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.orphanPayoutItems, 1);
  assert.equal(result.migrationReady, false);
});
