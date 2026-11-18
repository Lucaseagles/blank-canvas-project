import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const journey = read("../../docs/commerce/rubi-commerce-journey-observability.md");
const finance = read("../../docs/finance/rubi-financial-control-center-foundation.md");
const analytics = read("./analytics.ts");
const precheckout = read("../components/store/RubiPreCheckout.tsx");

test("commerce contract separates behavior, order, evidence and settlement", () => {
  for (const phrase of [
    "Behavior event",
    "Commercial order",
    "Payment evidence",
    "Financial entry/settlement",
    "redirect_only",
    "report_import",
    "attribution_unverified",
  ]) assert.ok(journey.includes(phrase), phrase);
});

test("current external pre-checkout is explicitly an intent, never a paid order", () => {
  assert.match(precheckout, /external_checkout_intent/);
  assert.match(precheckout, /RUBI_PRECHECKOUT_CONTINUE/);
  assert.match(journey, /does not prove that the destination accepted an order or payment/);
  assert.match(journey, /Client-generated events are untrusted observations/);
});

test("the target first-party cart requires immutable order snapshots and idempotency", () => {
  assert.match(journey, /rubi_carts/);
  assert.match(journey, /rubi_cart_items/);
  assert.match(journey, /rubi_orders/);
  assert.match(journey, /rubi_order_items/);
  assert.match(journey, /idempotent order events/);
});

test("client analytics remains a behavioral signal, not financial authority", () => {
  assert.match(analytics, /export async function trackEvent/);
  assert.match(analytics, /Promise<boolean>/);
  assert.match(journey, /Client-generated events are untrusted observations/);
  assert.match(finance, /cannot promote intent into a confirmed sale or cash receipt/);
});


test("analytics writer shares the app-shell identity keys for one journey timeline", () => {
  const root = read("../routes/__root.tsx");
  assert.match(analytics, /const ANON_KEY = "analytics_anonymous_id"/);
  assert.match(analytics, /const SESSION_KEY = "analytics_session_id"/);
  assert.match(root, /const key = "analytics_session_id"/);
  assert.match(root, /localStorage.getItem\("analytics_anonymous_id"\)/);
});

test("outbound analytics stores destination host, never affiliate query tokens", () => {
  assert.match(analytics, /destination_host: destinationHost/);
  assert.doesNotMatch(analytics, /url: affiliateUrl/);
  assert.match(analytics, /new URL\(affiliateUrl\)\.hostname/);
});
