import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./rubi-partner-precheckout-stage.functions.ts", import.meta.url),
  "utf8",
);

test("precheckout accepts only UUID-shaped partner, product and visit references", () => {
  assert.match(source, /partnerCode:z\.string\(\)\.uuid\(\)/);
  assert.match(source, /productId:z\.string\(\)\.uuid\(\)/);
  assert.match(source, /visitToken:z\.string\(\)\.uuid\(\)/);
});

test("precheckout requires an active partner link for the same product", () => {
  assert.match(source, /\.eq\("code",data\.partnerCode\)/);
  assert.match(source, /\.eq\("active",true\)/);
  assert.match(source, /link\.product_id!==data\.productId/);
});

test("precheckout requires an approved partner profile and active product grant", () => {
  assert.match(source, /\.eq\("audience","partner"\)\.eq\("status","approved"\)/);
  assert.match(source, /hub_partner_product_grants/);
  assert.match(source, /\.eq\("product_id",data\.productId\)\.eq\("active",true\)/);
});

test("precheckout requires an active supplier and an approved external checkout destination", () => {
  assert.match(source, /hub_suppliers!inner\(active,checkout_host\)/);
  assert.match(source, /\.eq\("hub_suppliers\.active",true\)/);
  assert.match(source, /approvedRubiCheckout\(product\.data\)/);
});

test("precheckout only updates a previously recorded recent visit with no prior marker", () => {
  assert.match(source, /\.eq\("referral_link_id",link\.id\)/);
  assert.match(source, /\.eq\("visit_token",data\.visitToken\)/);
  assert.match(source, /\.gte\("visited_at",cutoff\)/);
  assert.match(source, /\.is\("precheckout_viewed_at",null\)/);
  assert.match(source, /publicationId[\s\S]*?\.eq\("publication_id",data\.publicationId\)/);
});

test("precheckout never creates a visit or claims an order, payment or commission", () => {
  assert.doesNotMatch(source, /\.insert\(/);
  assert.doesNotMatch(source, /\.upsert\(/);
  assert.match(source, /does NOT imply external checkout, purchase or commission/);
  assert.match(source, /return \{recorded:!!marked\}/);
});
