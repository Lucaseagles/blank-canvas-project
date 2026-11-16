import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./rubi-video-playback.ts", import.meta.url), "utf8");

test("direct MP4 and WebM URLs use native playback", async () => {
  const { resolveRubiVideoPlayback } = await import("./rubi-video-playback.ts");
  assert.deepEqual(resolveRubiVideoPlayback("https://cdn.example.com/clip.mp4?token=abc"), {
    kind: "native", provider: "native", src: "https://cdn.example.com/clip.mp4?token=abc"
  });
  assert.equal(resolveRubiVideoPlayback("https://cdn.example.com/clip.webm").kind, "native");
});

test("YouTube watch, shorts and short links resolve to official privacy-enhanced embeds", async () => {
  const { resolveRubiVideoPlayback } = await import("./rubi-video-playback.ts");
  for (const url of ["https://www.youtube.com/watch?v=abcDEF12345", "https://youtu.be/abcDEF12345", "https://youtube.com/shorts/abcDEF12345"]) {
    assert.deepEqual(resolveRubiVideoPlayback(url), {
      kind: "embed", provider: "youtube", src: "https://www.youtube-nocookie.com/embed/abcDEF12345"
    });
  }
});

test("TikTok video URLs use the official player while short links remain link-outs", async () => {
  const { resolveRubiVideoPlayback } = await import("./rubi-video-playback.ts");
  assert.deepEqual(resolveRubiVideoPlayback("https://www.tiktok.com/@creator/video/1234567890123456789"), {
    kind: "embed", provider: "tiktok", src: "https://www.tiktok.com/player/v1/1234567890123456789"
  });
  assert.equal(resolveRubiVideoPlayback("https://vm.tiktok.com/shortcode/").kind, "external");
});

test("Instagram, Shopee, Kwai and SHEIN remain safe origin link-outs", async () => {
  const { resolveRubiVideoPlayback } = await import("./rubi-video-playback.ts");
  for (const [url, provider] of [
    ["https://www.instagram.com/reel/ABC123/", "instagram"],
    ["https://shopee.com.br/video/123", "shopee"],
    ["https://www.kwai.com/@creator/video/123", "kwai"],
    ["https://br.shein.com/video/123", "shein"]
  ]) assert.equal(resolveRubiVideoPlayback(url).kind === "external" && resolveRubiVideoPlayback(url).provider === provider, true);
});

test("non-HTTPS, credentials and malformed URLs are rejected", async () => {
  const { resolveRubiVideoPlayback } = await import("./rubi-video-playback.ts");
  for (const url of ["javascript:alert(1)", "http://example.com/clip.mp4", "https://user:pass@example.com/clip.mp4", "not a url", ""]) {
    assert.equal(resolveRubiVideoPlayback(url).kind, "invalid");
  }
});

test("feed uses the playback adapter and admin does not claim upload is active", () => {
  const route = readFileSync(new URL("../routes/videos.tsx", import.meta.url), "utf8");
  const admin = readFileSync(new URL("../routes/admin/videos.tsx", import.meta.url), "utf8");
  assert.match(route, /<VideoPlayback/);
  assert.doesNotMatch(route, /<VideoPlayer/);
  assert.doesNotMatch(admin, /Direct upload functionality active/i);
});
