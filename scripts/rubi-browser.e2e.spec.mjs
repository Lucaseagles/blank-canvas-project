import {test,expect} from "@playwright/test";
import {browserTarget,RUBI_BROWSER_PATHS,sameOriginNavigation} from "./rubi-browser-e2e-config.mjs";

const origin=browserTarget(process.env.RUBI_STOREFRONT_URL);
test.use({baseURL:origin,trace:"retain-on-failure"});
const widths=[{name:"mobile",width:390,height:844},{name:"desktop",width:1366,height:768}];

for(const viewport of widths){
 test.describe(`RUBI loja pública — ${viewport.name}`,()=>{
  test.use({viewport:{width:viewport.width,height:viewport.height}});
  test("vitrine HTTPS renderiza e permite descobrir produtos sem pagamento",async({page})=>{
   await page.goto(RUBI_BROWSER_PATHS.store,{waitUntil:"domcontentloaded"});
   await expect(page.getByRole("heading",{name:/Sua próxima descoberta/i})).toBeVisible();
   await expect(page.getByRole("heading",{name:/Explore a coleção/i})).toBeVisible();
   await expect(page.getByRole("link",{name:/Explorar vídeos/i}).first()).toBeVisible();
   expect(sameOriginNavigation(origin,page.url())).toBe(true);
   await page.screenshot({path:`artifacts/rubi-store-${viewport.name}.png`,fullPage:true});
  });
  test("feed de vídeos pode ser aberto sem confirmar pedidos",async({page})=>{
   await page.goto(RUBI_BROWSER_PATHS.videos,{waitUntil:"domcontentloaded"});
   await expect(page.getByRole("link",{name:"Abrir loja oficial RUBI Eagles"})).toBeVisible();
   await page.getByRole("link",{name:"Abrir loja oficial RUBI Eagles"}).click();
   await expect(page.getByRole("heading",{name:/Sua próxima descoberta/i})).toBeVisible();
  });
 });
}

test.describe("RUBI — isolamento sem credenciais",()=>{
 test("área Master não libera painel para sessão anônima",async({page})=>{
  await page.goto(RUBI_BROWSER_PATHS.master,{waitUntil:"domcontentloaded"});
  await expect(page.locator("body")).toBeVisible();
  // Redirecionamento a /auth é esperado. Mesmo em trânsito, o menu Master não deve aparecer.
  await expect(page.getByText("Produtos cadastrados",{exact:true})).toHaveCount(0);
  await expect(page.getByRole("button",{name:/Criar seção|Cadastrar fornecedor|Publicar oferta/i})).toHaveCount(0);
  await page.screenshot({path:"artifacts/rubi-anonymous-master.png",fullPage:true});
 });
 test("atacado não mostra valores B2B sem login aprovado",async({page})=>{
  await page.goto(RUBI_BROWSER_PATHS.wholesale,{waitUntil:"domcontentloaded"});
  await expect(page.getByText(/Entre na sua conta e solicite aprovação como lojista|Entre na sua conta para consultar preços de atacado/i).first()).toBeVisible({timeout:20000});
  await expect(page.getByText(/Preço base B2B/i)).toHaveCount(0);
 });
 test("portal de parceiros não mostra comissões sem autenticação",async({page})=>{
  await page.goto(RUBI_BROWSER_PATHS.partner,{waitUntil:"domcontentloaded"});
  await expect(page.getByText(/Entre na sua conta para acessar o portal de parceiros|Entre na sua conta\./i).first()).toBeVisible({timeout:20000});
  await expect(page.getByText(/R\$\s*\d[\d.,]*\s*em comissões/i)).toHaveCount(0);
 });
});
