import { defineConfig, devices } from "@playwright/test";
import { resolveRubiStagingTarget } from "./scripts/rubi-staging-story-target.mjs";

const baseURL = resolveRubiStagingTarget();

export default defineConfig({
  testDir: "./scripts",
  testMatch: /rubi-local-story-offer\.e2e\.spec\.mjs/,
  timeout: 60000,
  expect: { timeout: 25000 },
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [
    ["list"],
    ["json", { outputFile: process.env.RUBI_E2E_REPORT_PATH || "/tmp/rubi-story-staging-evidence.json" }],
  ],
  outputDir: process.env.RUNNER_TEMP
    ? process.env.RUNNER_TEMP + "/rubi-story-staging-playwright"
    : "/tmp/rubi-story-staging-playwright",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },
});
