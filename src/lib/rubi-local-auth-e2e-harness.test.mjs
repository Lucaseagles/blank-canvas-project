import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../../supabase/migrations/20261113090000_rubi_primary_master_roles.sql");
const fixture = read("../../scripts/rubi-local-auth-fixtures.mjs");
const workflow = read("../../.github/workflows/rubi-local-authenticated-e2e.yml");
const spec = read("../../scripts/rubi-local-authenticated.e2e.spec.mjs");
const config = read("../../rubi-local-playwright.config.mjs");

test("production founding-Master migration remains unchanged and local QA seeds the owner before it", () => {
  assert.match(migration, /if owner_count <> 1 then/);
  assert.match(migration, /Founding Master bootstrap requires exactly one existing owner role/);
  assert.match(workflow, /supabase db reset --version 20261113089999 --no-seed/);
  assert.match(workflow, /rubi-local-auth-fixtures\.mjs bootstrap-owner/);
  assert.match(workflow, /supabase migration up --local/);
  assert.match(fixture, /mode === "bootstrap-owner"/);
  assert.match(fixture, /mode === "seed-profiles"/);
  assert.match(fixture, /Founding Master migration did not register the disposable owner/);
});

test("QA fixture refuses non-local Supabase and generates temporary credentials without logging them", () => {
  assert.match(fixture, /Refusing to create RUBI QA identities outside the local Supabase instance/);
  assert.match(fixture, /randomBytes\(30\)/);
  assert.match(fixture, /GITHUB_ENV/);
  assert.doesNotMatch(fixture, /console\.log\([^\n]*(password|secret)/i);
  assert.match(fixture, /ownerCount\.count !== 1/);
});

test("local browser workflow never links or resets the hosted production database", () => {
  assert.match(workflow, /supabase start -x/);
  assert.match(workflow, /supabase stop --no-backup/);
  assert.doesNotMatch(workflow, /supabase link/);
  assert.doesNotMatch(workflow, /db reset --remote|db push --remote|migration up --remote/);
  assert.match(workflow, /VITE_SUPABASE_URL/);
  assert.match(workflow, /VITE_SUPABASE_PUBLISHABLE_KEY/);
});

test("four authenticated profiles are covered on mobile and desktop, including non-owner Master denial", () => {
  for (const profile of ["CONSUMER", "MERCHANT", "PARTNER", "MASTER"]) assert.match(spec, new RegExp(`key: "${profile}"`));
  assert.match(spec, /authenticated non-owner cannot enter the Master dashboard/i);
  assert.match(config, /rubi-local-authenticated/);
  assert.match(spec, /width: 390, height: 844/);
  assert.match(spec, /width: 1366, height: 768/);
});
