import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
 testDir:"./scripts",
 testMatch:/rubi-browser\.e2e\.spec\.mjs/,
 timeout:45000,
 expect:{timeout:20000},
 retries:1,
 workers:1,
 reporter:[["list"],["html",{outputFolder:"artifacts/rubi-playwright-report",open:"never"}],["json",{outputFile:"artifacts/rubi-browser-results.json"}]],
 outputDir:"artifacts/rubi-browser-test-results",
 use:{...devices["Desktop Chrome"],ignoreHTTPSErrors:false},
});
