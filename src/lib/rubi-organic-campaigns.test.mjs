import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeRubiCampaign,
  rubiOrganicProductPath,
  readRubiOrganicAttribution,
} from "./rubi-organic-campaigns.ts";

const productId = "9b372b7c-cb0d-4daa-8f1d-8c6eb9f67e05";

test("generates safe organic campaign links for own Store products", () => {
  assert.equal(normalizeRubiCampaign("  Beleza Novembro!  "), "beleza-novembro");
  const path = rubiOrganicProductPath(productId, "instagram", "Beleza Novembro!");
  assert.equal(path, `/hub-product/${productId}?utm_source=instagram&utm_medium=organic_social&utm_campaign=beleza-novembro`);
  assert.deepEqual(readRubiOrganicAttribution(path.split("?")[1]), { source: "instagram", campaign: "beleza-novembro" });
});

test("rejects unsafe IDs, unapproved media and spoofed campaigns", () => {
  assert.throws(() => rubiOrganicProductPath("../r/foo", "instagram", "lancamento"), /Produto inválido/);
  assert.throws(() => rubiOrganicProductPath(productId, "kairos", "lancamento"), /Canal/);
  assert.equal(readRubiOrganicAttribution("utm_source=https%3A%2F%2Fevil.test&utm_medium=organic_social&utm_campaign=lancamento"), null);
  assert.equal(readRubiOrganicAttribution("utm_source=instagram&utm_medium=paid&utm_campaign=lancamento"), null);
  assert.equal(readRubiOrganicAttribution("utm_source=instagram&utm_medium=organic_social&utm_campaign=../../evil"), null);
  assert.equal(readRubiOrganicAttribution("utm_source=instagram&utm_medium=organic_social&utm_campaign=lancamento&ref=other"), { source: "instagram", campaign: "lancamento" });
});

test("does not convert UTM campaigns into partner codes or payment destinations", () => {
  const path = rubiOrganicProductPath(productId, "tiktok", "casa");
  assert.ok(!path.includes("ref="));
  assert.ok(!path.includes("checkout="));
  assert.ok(!path.includes("affiliate="));
});
