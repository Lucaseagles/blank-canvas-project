import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("video create/update and product associations use one audited RPC", () => {
  const api = read("./video.functions.ts");
  const save = api.slice(api.indexOf("export const saveVideo"), api.indexOf("export const setVideoStatus"));
  assert.match(save, /rpc\("rubi_manage_video_audited"/);
  assert.match(save, /p_product_ids: productIds \?\? null/);
  assert.match(save, /p_actor: context\.userId/);
  assert.doesNotMatch(save, /\.from\("videos"\)\.(insert|update|delete)|\.from\("video_products"\)\.(insert|update|delete)/);
});

test("video status and delete are owner-gated audited RPC operations", () => {
  const api = read("./video.functions.ts");
  const status = api.slice(api.indexOf("export const setVideoStatus"), api.indexOf("export const deleteVideo"));
  const deletion = api.slice(api.indexOf("export const deleteVideo"));
  for (const section of [status, deletion]) {
    assert.match(section, /middleware\(\[requireOwnerRole\]\)/);
    assert.match(section, /rpc\("rubi_manage_video_audited"/);
    assert.match(section, /p_actor: context\.userId/);
  }
});

test("bridge video writes and deletes are owner-gated and audited", () => {
  const api = read("./bridge-video.functions.ts");
  for (const name of ["saveBridgeVideo", "deleteBridgeVideo"]) {
    const start = api.indexOf(`export const ${name}`);
    const section = api.slice(start);
    assert.match(section, /middleware\(\[requireOwnerRole\]\)/);
    assert.match(section, /rpc\('rubi_manage_bridge_video_audited'/);
    assert.match(section, /p_actor: context\.userId/);
  }
  assert.match(api, /assertPlatformLink\(data\.platform, data\.link\)/);
});

test("SQL enforces Owner, row locks, atomic associations and audit writes", () => {
  const sql = read("../../supabase/migrations/20261116200000_rubi_video_atomic_audit.sql");
  assert.match(sql, /security invoker/);
  assert.match(sql, /Owner authorization required/);
  assert.match(sql, /for update/);
  assert.match(sql, /delete from public\.video_products/);
  assert.match(sql, /insert into public\.video_products/);
  for (const event of ["RUBI_VIDEO_CREATED","RUBI_VIDEO_UPDATED","RUBI_VIDEO_STATUS_CHANGED","RUBI_VIDEO_DELETED","RUBI_BRIDGE_VIDEO_CREATED","RUBI_BRIDGE_VIDEO_UPDATED","RUBI_BRIDGE_VIDEO_DELETED"]) assert.match(sql, new RegExp(event));
  assert.equal((sql.match(/insert into public\.admin_audit_log/g) || []).length, 5);
  assert.match(sql, /coalesce\(nullif\(p_payload->>'status',''\),'draft'\)/);
  assert.doesNotMatch(sql, /nullif\(p_payload->>'status','draft'\)/);
  assert.match(sql, /revoke all on function public\.rubi_manage_video_audited/);
  assert.match(sql, /revoke all on function public\.rubi_manage_bridge_video_audited/);
  assert.match(sql, /sanitize_admin_audit_value/);
  assert.doesNotMatch(sql, /sanitize_admin_audit_json/);
  assert.match(sql, /to service_role/);
});


test("legacy native editor is retired while audited native and bridge entry points remain usable", () => {
  const createRoute = read("../routes/admin/videos.new.tsx");
  const editRoute = read("../routes/admin/videos.$id.edit.tsx");
  const adminVideos = read("../routes/admin/videos.tsx");
  assert.match(createRoute, /BridgeVideoForm/);
  assert.match(createRoute, /navigate\(\{ to: "\/admin\/videos" \}\)/);
  assert.ok(editRoute.includes('redirect({ to: "/admin/videos" })'));
  assert.match(adminVideos, /setIsDialogOpen\(true\)/);
  assert.match(adminVideos, /saveVideoFn\(\{ data \}\)/);
  assert.match(adminVideos, /New Bridge Video/);
  assert.equal(existsSync(new URL("../admin/videos/NativeVideoForm.tsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("../admin/videos/VideoForm.tsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("./supabase/videos.ts", import.meta.url)), false);
  assert.equal(existsSync(new URL("./supabase/external-videos.ts", import.meta.url)), false);
});

test("compliance rules retain the audited settings write path without a legacy direct upsert", () => {
  const compliance = read("./compliance.functions.ts");
  const settings = read("./admin-settings.functions.ts");
  const migration = read("../../supabase/migrations/20261113123000_rubi_admin_setting_atomic_audit.sql");
  assert.doesNotMatch(compliance, /export const saveComplianceRule/);
  assert.match(settings, /rubi_update_admin_setting_audited/);
  assert.match(migration, /when 'compliance_rules' then array\['rule_value','is_enforced','notes','source_url','reviewed_at'\]/);
});


test("disposable PostgreSQL concurrency proof exercises real row-lock serialization", () => {
  const script = read("./rubi-local-admin-audit-concurrency.sh");
  const workflow = read("../../.github/workflows/rubi-local-authenticated-e2e.yml");
  assert.match(script, /FOR UPDATE/);
  assert.match(script, /pg_sleep/);
  assert.match(script, /session_a_pid/);
  assert.match(script, /RUBI_VIDEO_STATUS_CHANGED/);
  assert.match(script, /ordered_transitions/);
  assert.ok(workflow.includes("bash scripts/rubi-local-admin-audit-concurrency.sh"));
});
