import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./rubi-precheckout.functions.ts", import.meta.url), "utf8");

test("partner checkout remains blocked until provider-issued attribution is verified", () => {
  const start = source.indexOf("if (partnerCode) {");
  const end = source.indexOf("\n    const destination = approvedRubiCheckout", start);
  assert.ok(start >= 0 && end > start, "partner branch must remain explicit and precede direct checkout");
  const partnerBranch = source.slice(start, end);

  assert.match(partnerBranch, /\.eq\("code", partnerCode\)\.eq\("active", true\)/);
  assert.match(partnerBranch, /referral\.product_id !== data\.productId/);
  assert.match(partnerBranch, /\.eq\("audience", "partner"\)/);
  assert.match(partnerBranch, /\.eq\("status", "approved"\)/);
  assert.match(partnerBranch, /\.eq\("active", true\)/);
  assert.match(partnerBranch, /Checkout do parceiro aguardando link oficial e atribuição confirmada pelo fornecedor/);
  assert.match(partnerBranch, /ready:\s*false/);
  assert.doesNotMatch(partnerBranch, /ready:\s*true/);
  assert.doesNotMatch(partnerBranch, /destination:\s*approvedRubiCheckout/);
  assert.doesNotMatch(partnerBranch, /return\s*\{\s*ready:\s*true/);
});

test("direct product checkout is evaluated only after the partner attribution gate", () => {
  const partnerGate = source.indexOf("if (partnerCode) {");
  const directCheckout = source.indexOf("const destination = approvedRubiCheckout(product as any)");
  assert.ok(partnerGate >= 0 && directCheckout > partnerGate);
  const directBranch = source.slice(directCheckout);
  assert.match(directBranch, /if \(!destination\)/);
  assert.match(directBranch, /return \{ ready: true, destination \}/);
});
