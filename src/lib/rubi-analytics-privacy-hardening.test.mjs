import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = new URL("../../supabase/migrations/20261126020000_rubi_analytics_events_owner_scoped_read_and_least_privilege.sql", import.meta.url);
const smokePath = new URL("../../scripts/rubi-local-analytics-privacy-smoke.sql", import.meta.url);
const workflowPath = new URL("../../.github/workflows/rubi-local-authenticated-e2e.yml", import.meta.url);

test("analytics events migration scopes personal reads and removes client mutation grants", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /ALTER TABLE public\.analytics_events ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /CREATE POLICY "Users can view their own events"[\s\S]*?FOR SELECT[\s\S]*?TO authenticated[\s\S]*?USING \(auth\.uid\(\) = user_id\)/i);
  assert.match(sql, /REVOKE ALL PRIVILEGES ON TABLE public\.analytics_events FROM PUBLIC, anon, authenticated/i);
  assert.match(sql, /GRANT INSERT ON TABLE public\.analytics_events TO anon/i);
  assert.match(sql, /GRANT SELECT, INSERT ON TABLE public\.analytics_events TO authenticated/i);
  assert.match(sql, /GRANT ALL PRIVILEGES ON TABLE public\.analytics_events TO service_role/i);
  assert.match(sql, /DROP POLICY IF EXISTS "Anyone can insert analytics_events"/i);
  assert.match(sql, /WITH CHECK \(auth\.uid\(\) = user_id\)/i);
  assert.match(sql, /WITH CHECK \(user_id IS NULL\)/i);
});

test("local PostgreSQL smoke checks RLS, anonymous restrictions and grants", async () => {
  const sql = await readFile(smokePath, "utf8");
  for (const expected of [
    "relrowsecurity",
    "Users can view their own events",
    "Users can insert their own events",
    "Anonymous events must be unattributed",
    "has_table_privilege('anon'",
    "has_table_privilege('authenticated'",
    "has_table_privilege('service_role'",
    "analytics_events RLS, personal isolation and least-privilege smoke: PASS",
  ]) assert.ok(sql.includes(expected), `missing smoke assertion: ${expected}`);
});

test("authenticated local E2E applies the analytics privacy smoke to disposable Supabase", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /Verify analytics personal-read isolation and least-privilege grants[\s\S]*?scripts\/rubi-local-analytics-privacy-smoke\.sql/);
  assert.match(workflow, /supabase migration up --local/);
  assert.match(workflow, /Stop and discard local Supabase/);
});
