import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("native and bridge video tables allow reads but only audited RPC writes", () => {
  const migration = read("../../supabase/migrations/20261127240000_rubi_video_content_dml_hardening.sql");
  const audit = read("../../supabase/migrations/20261116200000_rubi_video_atomic_audit.sql");
  const videoApi = read("./video.functions.ts");
  const bridgeApi = read("./bridge-video.functions.ts");
  const smoke = read("../../scripts/rubi-local-video-content-dml-hardening-smoke.sql");

  for (const policy of [
    '"Admin videos manage"',
    '"Admins can manage all videos"',
    '"Admins can manage video associations"',
    '"Owners can manage bridge videos"',
    '"Admins can manage bridge videos"',
  ]) assert.ok(migration.includes("drop policy if exists " + policy), policy);

  for (const policy of [
    '"Owners can view videos"',
    '"Owners can view video associations"',
    '"Owners can view bridge videos"',
  ]) assert.ok(migration.includes("create policy " + policy), policy);

  assert.ok(migration.includes("revoke all privileges on table"));
  assert.ok(migration.includes("from public, anon, authenticated"));
  assert.ok(migration.includes("to anon, authenticated"));
  assert.ok(migration.includes("to service_role"));
  assert.ok(!migration.includes('drop policy if exists "Public can view published videos"'));
  assert.ok(!migration.includes('drop policy if exists "Public can view video product associations"'));
  assert.ok(!migration.includes('drop policy if exists "Public can view active bridge videos"'));

  assert.ok(audit.includes("revoke all on function public.rubi_manage_video_audited"));
  assert.ok(audit.includes("grant execute on function public.rubi_manage_video_audited"));
  assert.ok(audit.includes("revoke all on function public.rubi_manage_bridge_video_audited"));
  assert.ok(audit.includes("grant execute on function public.rubi_manage_bridge_video_audited"));

  assert.ok(videoApi.includes('rpc("rubi_manage_video_audited"'));
  assert.ok(bridgeApi.includes("rubi_manage_bridge_video_audited"));
  assert.ok(!videoApi.includes('.from("videos").insert'));
  assert.ok(!videoApi.includes('.from("video_products").insert'));
  assert.ok(!bridgeApi.includes('.from("bridge_videos").insert'));

  for (const marker of [
    "RUBI_QA_EXPECTED_VIDEO_CONTENT_INSERT_DENIAL_NOT_RAISED",
    "RUBI_QA_EXPECTED_VIDEO_CONTENT_UPDATE_DENIAL_NOT_RAISED",
    "RUBI_QA_EXPECTED_VIDEO_CONTENT_DELETE_DENIAL_NOT_RAISED",
    "Public published video read was not preserved",
    "Public published-video association read was not preserved",
    "Public active bridge-video read was not preserved",
  ]) assert.ok(smoke.includes(marker), marker);
});
