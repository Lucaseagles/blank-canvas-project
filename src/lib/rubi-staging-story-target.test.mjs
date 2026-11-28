import assert from "node:assert/strict";
import test from "node:test";
import { resolveRubiStagingTarget, resolveRubiCheckoutAllowedHosts } from "../../scripts/rubi-staging-story-target.mjs";

const fixtureEnv = {
  RUBI_STAGING_CONFIRMATION: "I_CONFIRM_DISPOSABLE_STAGING",
  RUBI_STAGING_ALLOW_MUTATING_FIXTURES: "YES_DISPOSABLE_STAGING_FIXTURES_ONLY",
  RUBI_STAGING_BASE_URL: "https://staging.rubieagles.example",
  RUBI_STAGING_ALLOWED_ORIGIN: "https://staging.rubieagles.example",\n  RUBI_QA_CHECKOUT_ALLOWED_HOSTS: "checkout.kairos.example,payments.kairos.example",
  RUBI_QA_MASTER_EMAIL: "master@example.test",
  RUBI_QA_MASTER_PASSWORD: "disposable-password",
  RUBI_QA_CONSUMER_EMAIL: "consumer@example.test",
  RUBI_QA_CONSUMER_PASSWORD: "disposable-password",
  RUBI_QA_STORY_PRODUCT_ID: "00000000-0000-4000-8000-000000000001",
  RUBI_QA_STORY_TITLE: "Story sem checkout",
  RUBI_QA_RIGHTS_PRODUCT_ID: "00000000-0000-4000-8000-000000000002",
  RUBI_QA_RIGHTS_STORY_TITLE: "Story sem direitos",
  RUBI_QA_APPROVED_STORY_PRODUCT_ID: "00000000-0000-4000-8000-000000000003",
  RUBI_QA_APPROVED_STORY_TITLE: "Story aprovado",
  RUBI_QA_APPROVED_STORY_PRODUCT_TITLE: "Produto aprovado",
  RUBI_QA_STALE_STORY_TITLE: "Story obsoleto",
  RUBI_QA_INACTIVE_PRODUCT_PRODUCT_ID: "00000000-0000-4000-8000-000000000004",
  RUBI_QA_INACTIVE_PRODUCT_STORY_TITLE: "Story produto inativo",
  RUBI_QA_INACTIVE_SUPPLIER_PRODUCT_ID: "00000000-0000-4000-8000-000000000005",
  RUBI_QA_INACTIVE_SUPPLIER_STORY_TITLE: "Story fornecedor inativo",
};

test("accepts only an explicitly approved HTTPS staging origin with isolated fixtures", () => {
  assert.equal(resolveRubiStagingTarget(fixtureEnv), "https://staging.rubieagles.example");
});

test("rejects missing human confirmation before resolving any target", () => {
  assert.throws(
    () => resolveRubiStagingTarget({ ...fixtureEnv, RUBI_STAGING_CONFIRMATION: "NO" }),
    /Explicit disposable-staging confirmation/,
  );
});

test("rejects fixture mutation unless the environment explicitly authorizes disposable fixtures", () => {
  assert.throws(
    () => resolveRubiStagingTarget({ ...fixtureEnv, RUBI_STAGING_ALLOW_MUTATING_FIXTURES: "" }),
    /has not authorized mutation/,
  );
});

test("rejects HTTP even when the hostname is labelled staging", () => {
  assert.throws(
    () => resolveRubiStagingTarget({
      ...fixtureEnv,
      RUBI_STAGING_BASE_URL: "http://staging.rubieagles.example",
      RUBI_STAGING_ALLOWED_ORIGIN: "http://staging.rubieagles.example",
    }),
    /requires HTTPS/,
  );
});

test("rejects production and unlabelled hosts", () => {
  for (const host of ["https://rubieagles.example", "https://prod-staging.rubieagles.example", "https://production.rubieagles.example"]) {
    assert.throws(
      () => resolveRubiStagingTarget({ ...fixtureEnv, RUBI_STAGING_BASE_URL: host, RUBI_STAGING_ALLOWED_ORIGIN: host }),
      /must explicitly identify a non-production/,
    );
  }
});

test("rejects an origin that differs from the separately approved origin", () => {
  assert.throws(
    () => resolveRubiStagingTarget({
      ...fixtureEnv,
      RUBI_STAGING_BASE_URL: "https://qa.rubieagles.example",
    }),
    /must exactly match/,
  );
});

test("rejects paths, query strings, fragments and embedded credentials", () => {
  for (const target of [
    "https://staging.rubieagles.example/app",
    "https://staging.rubieagles.example/?token=secret",
    "https://staging.rubieagles.example/#checkout",
    "https://user:password@staging.rubieagles.example",
  ]) {
    assert.throws(
      () => resolveRubiStagingTarget({ ...fixtureEnv, RUBI_STAGING_BASE_URL: target }),
      /origin only/,
    );
  }
});

test("requires every disposable profile credential and Story gate fixture", () => {
  const missing = { ...fixtureEnv };
  delete missing.RUBI_QA_APPROVED_STORY_TITLE;
  assert.throws(
    () => resolveRubiStagingTarget(missing),
    /RUBI_QA_APPROVED_STORY_TITLE/,
  );
});


test("rejects malformed product fixture UUIDs before starting Playwright", () => {
  assert.throws(
    () => resolveRubiStagingTarget({ ...fixtureEnv, RUBI_QA_APPROVED_STORY_PRODUCT_ID: "approved-product" }),
    /valid UUID fixture identifiers: RUBI_QA_APPROVED_STORY_PRODUCT_ID/,
  );
});

test("rejects duplicate product fixture identifiers that could cross-contaminate Story gates", () => {
  assert.throws(
    () => resolveRubiStagingTarget({
      ...fixtureEnv,
      RUBI_QA_INACTIVE_PRODUCT_PRODUCT_ID: fixtureEnv.RUBI_QA_STORY_PRODUCT_ID,
    }),
    /distinct product fixture UUIDs/,
  );
});

test("rejects malformed QA email values before browser login", () => {
  assert.throws(
    () => resolveRubiStagingTarget({ ...fixtureEnv, RUBI_QA_CONSUMER_EMAIL: "not-an-email" }),
    /invalid QA email values: RUBI_QA_CONSUMER_EMAIL/,
  );
});

test("accepts exact provider checkout DNS host allowlist", () => {
  assert.deepEqual(resolveRubiCheckoutAllowedHosts(fixtureEnv), ["checkout.kairos.example", "payments.kairos.example"]);
});

test("rejects wildcard, URL, port and path entries in provider checkout allowlist", () => {
  for (const value of ["*.kairos.example", "https://checkout.kairos.example", "checkout.kairos.example:443", "checkout.kairos.example/path", "checkout.kairos.example,"]) {
    assert.throws(() => resolveRubiCheckoutAllowedHosts({ ...fixtureEnv, RUBI_QA_CHECKOUT_ALLOWED_HOSTS: value }), /exact DNS hostnames only/);
  }
});

test("rejects duplicate provider checkout hosts", () => {
  assert.throws(() => resolveRubiCheckoutAllowedHosts({ ...fixtureEnv, RUBI_QA_CHECKOUT_ALLOWED_HOSTS: "checkout.kairos.example,checkout.kairos.example" }), /duplicate hostnames/);
});

test("staging target requires an explicit provider checkout allowlist", () => {
  const env = { ...fixtureEnv };
  delete env.RUBI_QA_CHECKOUT_ALLOWED_HOSTS;
  assert.throws(() => resolveRubiStagingTarget(env), /RUBI_QA_CHECKOUT_ALLOWED_HOSTS/);
});
