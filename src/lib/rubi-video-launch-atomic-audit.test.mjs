import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("scheduled video automation delegates publication and queueing to one audited RPC", () => {
  const api = read("./automation.functions.ts");
  const start = api.indexOf("export const processVideoLaunches");
  const section = api.slice(start);
  assert.match(section, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(section, /handler\(async \(\{ context \}\)/);
  assert.match(section, /rubi_process_due_video_launch_audited/);
  assert.match(section, /p_actor: context\.userId/);
  assert.doesNotMatch(section, /\.from\(["']videos["']\)\.update\(/);
  assert.doesNotMatch(section, /\.from\(["']scheduled_posts["']\)\.insert\(/);
});

test("atomic launch SQL locks the video and records publication plus queue audit in one transaction", () => {
  const sql = read("../../supabase/migrations/20261118010000_rubi_video_launch_atomic_audit.sql");
  assert.match(sql, /security invoker/);
  assert.match(sql, /Owner authorization required/);
  assert.match(sql, /from public\.videos[\s\S]*for update/);
  assert.match(sql, /old_video\.status <> 'draft'/);
  assert.match(sql, /old_video\.scheduled_for > v_now/);
  assert.match(sql, /update public\.videos[\s\S]*set status='published'/);
  assert.match(sql, /RUBI_VIDEO_LAUNCH_PUBLISHED/);
  assert.match(sql, /RUBI_VIDEO_LAUNCH_QUEUED/);
  assert.match(sql, /scheduled_posts[\s\S]*status in \('pending','processing','published'\)/);
  assert.match(sql, /revoke all on function public\.rubi_process_due_video_launch_audited/);
  assert.match(sql, /to service_role/);
});

test("the automation returns explicit outcomes for due, already processed and not-yet-due videos", () => {
  const sql = read("../../supabase/migrations/20261118010000_rubi_video_launch_atomic_audit.sql");
  for (const outcome of ["already_processed", "not_due", "published"]) {
    assert.match(sql, new RegExp(`'status','${outcome}'`));
  }
  assert.match(sql, /'already_queued'/);
  assert.match(sql, /'unsupported_channels'/);
});
