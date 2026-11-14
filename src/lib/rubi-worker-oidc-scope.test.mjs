import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const worker = readFileSync(new URL("../../supabase/functions/scheduled-publishing/index.ts", import.meta.url), "utf8");
const workflow = readFileSync(new URL("../../.github/workflows/scheduled-publishing.yml", import.meta.url), "utf8");

test("worker OIDC is restricted to main scheduled-publishing workflow, not any repository token", () => {
  assert.match(worker, /const EXPECTED_REF = "refs\/heads\/main"/);
  assert.match(worker, /const EXPECTED_WORKFLOW_REF = `${REPO}\/\.github\/workflows\/scheduled-publishing\.yml@${EXPECTED_REF}`/);
  assert.match(worker, /claims\.ref !== EXPECTED_REF/);
  assert.match(worker, /claims\.workflow_ref !== EXPECTED_WORKFLOW_REF/);
  assert.match(worker, /claims\.event_name !== "schedule" && claims\.event_name !== "workflow_dispatch"/);
  assert.match(worker, /claims\.iss !== ISSUER/);
  assert.match(worker, /claims\.aud !== EXPECTED_AUDIENCE/);
  assert.match(worker, /claims\.repository !== REPO/);
  assert.match(worker, /crypto\.subtle\.verify/);
  assert.match(worker, /claims\.exp <= now/);
  assert.match(workflow, /cron: '\*\/5 \* \* \* \*'/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /id-token: write/);
});
