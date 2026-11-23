import { test, expect } from "@playwright/test";

const profiles = [
  { key: "CONSUMER", path: "/feed", heading: /FEED DE DESCOBERTA/i, proof: "consumer" },
  { key: "MERCHANT", path: "/wholesale", heading: /Abasteça seu negócio/i, proof: "merchant" },
  { key: "PARTNER", path: "/partner/portal", heading: /Seu portal de parceiros/i, proof: "partner" },
  { key: "MASTER", path: "/admin", heading: null, proof: "master" },
];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1366, height: 768 },
];

const scrubSensitive = (value) => value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, "[EMAIL]");

async function signIn(page, key, path, expectedPath = path) {
  const browserDiagnostics = { pageErrors: [], failedRequests: [], consoleErrors: [], httpErrors: [] };
  page.on("pageerror", (error) => browserDiagnostics.pageErrors.push(error.message));
  page.on("response", async (response) => {
    if (response.status() < 400) return;
    const request = response.request();
    let body = "";
    try {
      body = (await response.text()).slice(0, 500);
    } catch {
      body = "response body unavailable";
    }
    const url = new URL(response.url());
    browserDiagnostics.httpErrors.push({
      status: response.status(),
      method: request.method(),
      url: `${url.origin}${url.pathname}`,
      body: body.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, "[EMAIL]"),
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error") browserDiagnostics.consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const url = new URL(request.url());
    browserDiagnostics.failedRequests.push(`${request.method()} ${url.origin}${url.pathname}: ${request.failure()?.errorText ?? "request failed"}`);
  });
  const email = process.env[`RUBI_QA_${key}_EMAIL`];
  const password = process.env[`RUBI_QA_${key}_PASSWORD`];
  if (!email || !password) throw new Error(`Missing ephemeral credentials for ${key}.`);
  await page.goto(`/auth?returnTo=${encodeURIComponent(path)}`);
  // Use the login form's own unique placeholder, not a page-wide email selector.
  await page.getByPlaceholder("operator@system.io").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Engajar Sistema" }).click();

  // Wait for either the expected route or a visible auth error in one bounded poll.
  // This avoids a sequential toast delay and leaves no competing promise running.
  try {
    await page.waitForFunction(
      ({ expectedPath }) => {
        const authError = document.querySelector('[data-sonner-toast][data-type="error"]');
        return window.location.pathname === expectedPath || Boolean(authError);
      },
      { expectedPath },
      { timeout: 30000 },
    );
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      pathname: window.location.pathname,
      title: document.title,
      bodyText: (document.body?.innerText ?? "").slice(0, 2500),
      toasts: Array.from(document.querySelectorAll("[data-sonner-toast]")).map((toast) => ({
        type: toast.getAttribute("data-type"),
        text: (toast.textContent ?? "").slice(0, 500),
      })),
      loginButton: (() => {
        const button = Array.from(document.querySelectorAll("button")).find((item) => /Engajar Sistema|Autenticando/i.test(item.innerText));
        return button ? { text: button.innerText, disabled: button.disabled } : null;
      })(),
    }));
    const scrub = (value) => value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, "[EMAIL]");
    throw new Error(`Authentication wait timed out for ${key}. Browser state: ${scrub(JSON.stringify(diagnostic))}. Runtime diagnostics: ${scrub(JSON.stringify(browserDiagnostics))}. Original: ${error.message}`);
  }

  if (page.url() && new URL(page.url()).pathname !== expectedPath) {
    const feedbackText = (
      await page.locator('[data-sonner-toast][data-type="error"]').first().innerText()
    ).trim();
    throw new Error(`Authentication rejected for ${key}: ${feedbackText || "unspecified authentication error"}. Runtime diagnostics: ${scrubSensitive(JSON.stringify(browserDiagnostics))}`);
  }
}

for (const viewport of viewports) {
  test.describe(`RUBI authenticated profiles — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const profile of profiles) {
      test(`${profile.key} authenticates and reaches its protected journey`, async ({ page }) => {
        await signIn(page, profile.key, profile.path);
        if (profile.heading) await expect(page.getByRole("heading", { name: profile.heading }).first()).toBeVisible();
        if (profile.proof === "merchant") {
          await expect(page.getByText("Catálogo em preparação")).toBeVisible();
          await expect(page.getByText(/Entre na sua conta e solicite aprovação como lojista/i)).toHaveCount(0);
        }
        if (profile.proof === "partner") {
          await expect(page.getByText("Bem-vindo, RUBI QA Parceiro. 0 produtos autorizados.")).toBeVisible();
          await expect(page.getByText(/Cadastro em análise/i)).toHaveCount(0);
        }
        if (profile.proof === "master") {
          await expect(page.getByText("Verificando acesso seguro...")).toHaveCount(0);
          await expect(page).toHaveURL((url) => /^\/admin(?:\/|$)/.test(url.pathname));
        }
      });
    }

    test("authenticated non-owner cannot enter the Master dashboard", async ({ page }) => {
      await signIn(page, "CONSUMER", "/admin", "/");
      await expect(page.getByText("Verificando acesso seguro...")).toHaveCount(0);
    });
  });
}
