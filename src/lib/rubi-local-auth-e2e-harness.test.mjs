import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../../supabase/migrations/20261113090000_rubi_primary_master_roles.sql");
const fixture = read("../../scripts/rubi-local-auth-fixtures.mjs");
const workflow = read("../../.github/workflows/rubi-local-authenticated-e2e.yml");
const spec = read("../../scripts/rubi-local-authenticated.e2e.spec.mjs");
const config = read("../../rubi-local-playwright.config.mjs");

test("clean local database remains fail-closed until exactly one founding Master is seeded", () => {
  assert.match(migration, /if owner_count = 0 then[\s\S]*?primary Master remains uninitialized/);
  assert.match(migration, /elsif owner_count <> 1 then[\s\S]*?requires exactly one existing owner role/);
  assert.match(migration, /elsif not exists\(select 1 from public\.rubi_primary_master where user_id=founding_owner\)/);
  assert.match(migration, /Founding Master authorization required/);
});

test("QA fixture refuses non-local Supabase and generates temporary credentials without logging them", () => {
  assert.match(fixture, /Refusing to create RUBI QA identities outside the local Supabase instance/);
  assert.match(fixture, /randomBytes\(30\)/);
  assert.match(fixture, /GITHUB_ENV/);
  assert.doesNotMatch(fixture, /console\.log\([^\n]*(password|secret)/i);
  assert.match(fixture, /finalOwners\.count !== 1/);
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
  assert.match(config, /390/); // viewport matrix is declared in the E2E spec
  assert.match(spec, /width: 390, height: 844/);
  assert.match(spec, /width: 1366, height: 768/);
});
