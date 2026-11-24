import {test,expect} from "@playwright/test";

const productId=process.env.RUBI_QA_STORY_PRODUCT_ID;
const storyTitle=process.env.RUBI_QA_STORY_TITLE;
if(!productId||!storyTitle)throw new Error("Disposable local Story fixture environment is missing.");

async function signIn(page,key,path){
 const email=process.env[`RUBI_QA_${key}_EMAIL`];
 const password=process.env[`RUBI_QA_${key}_PASSWORD`];
 if(!email||!password)throw new Error(`Missing disposable ${key} credentials.`);
 await page.goto(`/auth?returnTo=${encodeURIComponent(path)}`);
 await page.waitForLoadState("networkidle");
 await page.getByPlaceholder("operator@system.io").fill(email);
 await page.locator('input[type="password"]').fill(password);
 await page.getByRole("button",{name:"Engajar Sistema"}).click();
 await page.waitForURL(url=>url.pathname===path,{timeout:30000});
}

for(const viewport of [{name:"mobile",width:390,height:844},{name:"desktop",width:1366,height:768}]){
 test.describe(`RUBI Story persistido — bloqueio seguro de publicação — ${viewport.name}`,()=>{
  test.use({viewport:{width:viewport.width,height:viewport.height}});
  test("Master não publica Story quando produto não possui checkout oficial verificado",async({page})=>{
   await signIn(page,"MASTER","/admin/hub-catalog");
   const storyAdmin=page.getByRole("region",{name:"RUBI Stories por produto"});
   await storyAdmin.getByLabel("Produto").selectOption(productId);
   const storyCard=storyAdmin.getByRole("button",{name:new RegExp(storyTitle)});
   await expect(storyCard).toBeVisible({timeout:20000});
   await storyCard.click();
   await expect(storyAdmin.getByText("Rascunho privado")).toBeVisible();
   const approve=storyAdmin.getByRole("button",{name:"Aprovar e publicar Story"});
   await expect(approve).toBeVisible();
   page.once("dialog",dialog=>dialog.accept());
   await approve.click();
   await expect(page.locator('[data-sonner-toast][data-type="error"]')).toContainText(/checkout oficial aprovado e fornecedor ativo/i);
   await expect(storyAdmin.getByText("Rascunho privado")).toBeVisible();
   await expect(storyAdmin.getByText("Aprovado e visível")).toHaveCount(0);
   await expect(storyAdmin.getByRole("button",{name:"Aprovar e publicar Story"})).toBeVisible();
  });
 });
}

test.describe("RUBI Story aprovado → produto correspondente → pré-checkout local",()=>{
 test("Master aprova o Story persistido e consumidor encontra a mesma oferta sem sair para pagamento",async({browser})=>{
  const productId=process.env.RUBI_QA_APPROVED_STORY_PRODUCT_ID;
  const storyTitle=process.env.RUBI_QA_APPROVED_STORY_TITLE;
  const productTitle=process.env.RUBI_QA_APPROVED_STORY_PRODUCT_TITLE;
  if(!productId||!storyTitle||!productTitle)throw new Error("Disposable approved Story fixture environment is missing.");
  const masterContext=await browser.newContext({viewport:{width:1366,height:768}});
  const masterPage=await masterContext.newPage();
  await signIn(masterPage,"MASTER","/admin/hub-catalog");
  const storyAdmin=masterPage.getByRole("region",{name:"RUBI Stories por produto"});
  await storyAdmin.getByLabel("Produto").selectOption(productId);
  const storyCard=storyAdmin.getByRole("button",{name:new RegExp(storyTitle)});
  await expect(storyCard).toBeVisible({timeout:20000});
  await storyCard.click();
  await expect(storyAdmin.getByText("Rascunho privado")).toBeVisible();
  masterPage.once("dialog",dialog=>dialog.accept());
  await storyAdmin.getByRole("button",{name:"Aprovar e publicar Story"}).click();
  await expect(masterPage.locator('[data-sonner-toast][data-type="success"]')).toContainText(/Story aprovado para exibição/i);
  await masterContext.close();
  const consumerContext=await browser.newContext({viewport:{width:390,height:844}});
  const consumerPage=await consumerContext.newPage();
  await signIn(consumerPage,"CONSUMER","/hub-product/"+productId);
  await expect(consumerPage.getByRole("heading",{name:productTitle})).toBeVisible();
  const storySection=consumerPage.getByRole("region",{name:"Histórias e vídeos deste produto"});
  await expect(storySection.getByRole("heading",{name:storyTitle})).toBeVisible({timeout:20000});
  const offerLink=storySection.getByRole("link",{name:/Consultar preço e compra oficial/i});
  await expect(offerLink).toBeVisible();
  await offerLink.click();
  await expect(consumerPage).toHaveURL(new RegExp("/hub-product/"+productId+"#rubi-purchase$"));
  await expect(consumerPage.getByRole("button",{name:/Continuar para pagamento no fornecedor/i})).toBeEnabled({timeout:20000});
  await expect(consumerPage.getByText(/A RUBI não coleta dados do cartão nesta página/i)).toBeVisible();
  await consumerContext.close();
 });
});
