import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("approved partner portal exposes a private storefront link manager", () => {
  const api = read("./partner-portal.functions.ts");
  const portal = read("../routes/partner/portal.tsx");
  const manager = read("../components/partner/RubiPartnerStorefrontManager.tsx");
  assert.match(api, /public_store_code/);
  assert.match(portal, /RubiPartnerStorefrontManager storeCode=\{profile\.public_store_code/);
  assert.match(manager, /navigator\.clipboard\.writeText/);
  assert.match(manager, /\/loja\/\$storeCode/);
  assert.match(manager, /Visualizar/);
});
