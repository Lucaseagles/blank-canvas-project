import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./scripts",
  testMatch: /rubi-local-(?:authenticated|story-offer)\.e2e\.spec\.mjs/,
  timeout: 60000,
  expect: { timeout: 25000 },
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: process.env.RUBI_E2E_REPORT_PATH || "/tmp/rubi-local-auth-evidence.json" }]],
  outputDir: process.env.RUNNER_TEMP ? `${process.env.RUNNER_TEMP}/rubi-local-playwright` : "/tmp/rubi-local-playwright",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4173",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
