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
   await approve.click();
   await expect(page.locator('[data-sonner-toast][data-type="error"]')).toContainText(/checkout oficial aprovado e fornecedor ativo/i);
   await expect(storyAdmin.getByText("Rascunho privado")).toBeVisible();
   await expect(storyAdmin.getByText("Aprovado e visível")).toHaveCount(0);
   await expect(storyAdmin.getByRole("button",{name:"Aprovar e publicar Story"})).toBeVisible();
  });
 });
}
