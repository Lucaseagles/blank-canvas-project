import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("native video upload is Owner-gated, MIME/size validated and uses a private bucket", () => {
  const api = read("./video.functions.ts");
  const upload = api.slice(api.indexOf("export const createVideoUploadUrl"), api.indexOf("export const discardVideoUpload"));
  assert.match(upload, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(upload, /z\.enum\(VIDEO_MIME_TYPES\)/);
  assert.match(upload, /max\(VIDEO_MAX_BYTES\)/);
  assert.match(upload, /createBucket\(VIDEO_BUCKET/);
  assert.match(upload, /public: false/);
  assert.match(upload, /createSignedUploadUrl\(path\)/);
  assert.match(upload, /owner\/\$\{context\.userId\}/);
  assert.doesNotMatch(upload, /getPublicUrl/);
});

test("published native videos use expiring signed URLs and do not expose raw storage paths", () => {
  const api = read("./video.functions.ts");
  const feed = api.slice(api.indexOf("export const getVideos"), api.indexOf("export const getAdminVideos"));
  assert.match(feed, /createSignedUrl\(video\.storage_path, VIDEO_SIGNED_URL_SECONDS\)/);
  assert.match(feed, /playback_url:/);
  assert.match(feed, /storage_path: undefined/);
  assert.match(feed, /status", "published/);
  const page = read("../routes/videos.tsx");
  assert.match(page, /src=\{video\.playback_url \|\| video\.external_url/);
});

test("admin upload uses a signed token and enforces the browser-side file contract", () => {
  const page = read("../routes/admin/videos.tsx");
  assert.match(page, /accept="video\/mp4,video\/webm"/);
  assert.match(page, /100 \* 1024 \* 1024/);
  assert.match(page, /createVideoUploadFn/);
  assert.match(page, /uploadToSignedUrl\(signed\.path, signed\.token/);
  assert.match(page, /discardVideoUploadFn\(\{ data: \{ path: uploadedPath \} \}\)/);
  const api = read("./video.functions.ts");
  const cleanup = api.slice(api.indexOf("export const discardVideoUpload"), api.indexOf("export const saveVideo"));
  assert.match(cleanup, /middleware\(\[requireOwnerRole\]\)/);
  assert.match(cleanup, /storage\.from\(VIDEO_BUCKET\)\.remove\(\[data\.path\]\)/);
});

test("video Storage RLS is restricted to the Owner path and never grants anonymous reads", () => {
  const sql = read("../../supabase/migrations/20261116235000_rubi_video_storage_sprint222.sql");
  assert.match(sql, /for all\s+to authenticated/i);
  assert.match(sql, /public\.has_role\(\(select auth\.uid\(\)\), 'owner'/);
  assert.match(sql, /storage\.foldername\(name\).*'owner'/s);
  assert.doesNotMatch(sql, /to anon|to public|create policy .*select/i);
});
