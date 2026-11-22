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

async function signIn(page, key, path, expectedPath = path) {
  const email = process.env[`RUBI_QA_${key}_EMAIL`];
  const password = process.env[`RUBI_QA_${key}_PASSWORD`];
  if (!email || !password) throw new Error(`Missing ephemeral credentials for ${key}.`);
  await page.goto(`/auth?returnTo=${encodeURIComponent(path)}`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Engajar Sistema" }).click();
  await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 30000 });
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
          await expect(page).toHaveURL(/\/admin(?:\/|$)/);
        }
      });
    }

    test("authenticated non-owner cannot enter the Master dashboard", async ({ page }) => {
      await signIn(page, "CONSUMER", "/admin", "/");
      await expect(page.getByText("Verificando acesso seguro...")).toHaveCount(0);
    });
  });
}
