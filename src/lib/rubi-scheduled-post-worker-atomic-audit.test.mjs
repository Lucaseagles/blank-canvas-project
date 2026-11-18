import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("scheduled worker claims and completes posts only through atomic audited RPCs", () => {
  const sql = read("../../supabase/migrations/20261118020000_rubi_scheduled_post_worker_atomic_audit.sql");
  const server = read("./scheduled-publishing.server.ts");
  const edge = read("../../supabase/functions/scheduled-publishing/index.ts");
  for (const source of [server, edge]) {
    assert.match(source, /rpc\("rubi_claim_scheduled_post_audited"/);
    assert.match(source, /rpc\("rubi_finish_scheduled_post_audited"/);
    assert.doesNotMatch(source, /\.from\(["']scheduled_posts["']\)\s*\n?\s*\.update\(/);
  }
  assert.match(sql, /auth\.role\(\)\s*<>\s*'service_role'/);
  assert.match(sql, /for update/);
  assert.match(sql, /old_post\.created_by/);
  assert.match(sql, /RUBI_SCHEDULED_POST_PROCESSING_STARTED/);
  assert.match(sql, /RUBI_SCHEDULED_POST_PUBLISHED/);
  assert.match(sql, /RUBI_SCHEDULED_POST_FAILED/);
  assert.match(sql, /insert into public\.admin_audit_log/);
  assert.match(sql, /revoke all on function[\s\S]*grant execute[\s\S]*to service_role/);
  assert.match(sql, /error_recorded/);
  assert.doesNotMatch(sql, /p_error_message\s*,\s*'error_message'/);
});
