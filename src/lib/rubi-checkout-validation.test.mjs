import assert from "node:assert/strict";
import test from "node:test";
import { approvedRubiCheckout, normalizeRubiCheckoutHost, verifyRubiCheckoutUrl } from "./rubi-checkout-validation.ts";

test("RUBI validates only separately approved exact supplier hostnames", () => {
  assert.equal(normalizeRubiCheckoutHost(" Checkout.Kairos.Example "), "checkout.kairos.example");
  assert.equal(normalizeRubiCheckoutHost("https://checkout.kairos.example"), null);
  assert.equal(normalizeRubiCheckoutHost("localhost"), null);
  assert.equal(normalizeRubiCheckoutHost("checkout.kairos.example/path"), null);
  assert.equal(
    verifyRubiCheckoutUrl("https://checkout.kairos.example/order/offer?id=123", "checkout.kairos.example"),
    "https://checkout.kairos.example/order/offer?id=123",
  );
  assert.equal(verifyRubiCheckoutUrl("https://other.kairos.example/offer", "checkout.kairos.example"), null);
  assert.equal(verifyRubiCheckoutUrl("https://checkout.kairos.example.attacker.test/offer", "checkout.kairos.example"), null);
  assert.equal(verifyRubiCheckoutUrl("http://checkout.kairos.example/offer", "checkout.kairos.example"), null);
  assert.equal(verifyRubiCheckoutUrl("https://checkout.kairos.example:8443/offer", "checkout.kairos.example"), null);
  assert.equal(verifyRubiCheckoutUrl("https://user:pass@checkout.kairos.example/offer", "checkout.kairos.example"), null);
  assert.equal(verifyRubiCheckoutUrl("https://checkout.kairos.example/offer#fragment", "checkout.kairos.example"), null);
  assert.equal(verifyRubiCheckoutUrl("javascript:alert(1)", "checkout.kairos.example"), null);
});

test("RUBI blocks checkout when unverified, inactive or missing approved supplier", () => {
  const checkout_url = "https://checkout.kairos.example/product/test";
  const supplier = { active: true, checkout_host: "checkout.kairos.example" };
  assert.equal(approvedRubiCheckout({ checkout_url, checkout_verified: true, hub_suppliers: supplier }), checkout_url);
  assert.equal(approvedRubiCheckout({ checkout_url, checkout_verified: false, hub_suppliers: supplier }), null);
  assert.equal(approvedRubiCheckout({ checkout_url, checkout_verified: true, hub_suppliers: { ...supplier, active: false } }), null);
  assert.equal(approvedRubiCheckout({ checkout_url, checkout_verified: true, hub_suppliers: null }), null);
  assert.equal(approvedRubiCheckout({ checkout_url: null, checkout_verified: true, hub_suppliers: supplier }), null);
});

test("RUBI rejects URL parser edge cases that can disguise the real destination", () => {
  const expected = "checkout.kairos.example";
  assert.equal(verifyRubiCheckoutUrl(" https://checkout.kairos.example/offer ", expected), "https://checkout.kairos.example/offer");
  assert.equal(verifyRubiCheckoutUrl("https://checkout.kairos.example\\@attacker.test/offer", expected), null);
  assert.equal(verifyRubiCheckoutUrl("https://checkout.kairos.example.attacker.test/offer", expected), null);
  assert.equal(verifyRubiCheckoutUrl("https://checkout.kairos.example./offer", expected), null);
  assert.equal(verifyRubiCheckoutUrl("https://127.0.0.1/offer", expected), null);
  assert.equal(verifyRubiCheckoutUrl("https://[::1]/offer", expected), null);
  assert.equal(verifyRubiCheckoutUrl("https://checkout.kairos.example:444/offer", expected), null);
  assert.equal(verifyRubiCheckoutUrl("https://checkout.kairos.example:443/offer", expected), "https://checkout.kairos.example/offer");
  assert.equal(verifyRubiCheckoutUrl("https://checkout.kairos.example/offer#redirect", expected), null);
  assert.equal(verifyRubiCheckoutUrl("https://checkout.kairos.example/" + "a".repeat(2001), expected), null);
});

test("RUBI host allowlist rejects ambiguous, local and malformed host declarations", () => {
  for (const host of [
    "", "localhost", "127.0.0.1", "[::1]", "https://checkout.kairos.example",
    "checkout.kairos.example.", ".checkout.kairos.example", "checkout..kairos.example",
    "checkout.kairos.example/path", "checkout.kairos.example:443", "checkout_kairos.example",
    "checkout.kairos.example\\n.attacker.test",
  ]) {
    assert.equal(normalizeRubiCheckoutHost(host), null, `expected invalid host: ${host}`);
  }
});
