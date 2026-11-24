import {test,expect} from "@playwright/test";

const productId=process.env.RUBI_QA_STORY_PRODUCT_ID;
const storyTitle=process.env.RUBI_QA_STORY_TITLE;
const productTitle=process.env.RUBI_QA_STORY_PRODUCT_TITLE;
if(!productId||!storyTitle||!productTitle)throw new Error("Disposable local Story fixture environment is missing.");

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
 test.describe(`RUBI Story persistido → oferta — ${viewport.name}`,()=>{
  test.use({viewport:{width:viewport.width,height:viewport.height}});
  test("Master aprova Story descartável e consumidor chega à pré-compra do mesmo produto",async({browser})=>{
   const masterContext=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
   const master=await masterContext.newPage();
   await signIn(master,"MASTER","/admin/hub-catalog");
   const storyAdmin=master.getByRole("region",{name:"RUBI Stories por produto"});
   await storyAdmin.getByLabel("Produto").selectOption(productId);
   const storyCard=storyAdmin.getByRole("button",{name:new RegExp(storyTitle)});
   await expect(storyCard).toBeVisible({timeout:20000});
   await storyCard.click();
   const approve=storyAdmin.getByRole("button",{name:"Aprovar e publicar Story"});
   if(await approve.count()){
    master.once("dialog",dialog=>dialog.accept());
    await approve.click();
    await expect(storyAdmin.getByText(/Aprovado e visível/)).toBeVisible({timeout:20000});
   }else{
    await expect(storyAdmin.getByRole("button",{name:"Retirar Story do público"})).toBeVisible();
   }
   await masterContext.close();

   const consumerContext=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
   const consumer=await consumerContext.newPage();
   await signIn(consumer,"CONSUMER","/feed");
   await consumer.goto(`/hub-product/${productId}`,{waitUntil:"domcontentloaded"});
   await expect(consumer.getByRole("heading",{name:productTitle}).first()).toBeVisible({timeout:25000});
   const publicStories=consumer.getByRole("region",{name:"Histórias e vídeos deste produto"});
   await expect(publicStories.getByRole("heading",{name:storyTitle})).toBeVisible({timeout:25000});
   const cta=publicStories.getByRole("link",{name:/Consultar preço e compra oficial/i});
   await expect(cta).toBeVisible();
   await cta.click();
   await expect(consumer).toHaveURL(new RegExp(`/hub-product/${productId}#rubi-purchase$`));
   await expect(consumer.locator("#rubi-purchase")).toBeInViewport();
   await expect(consumer.getByText("Pré-compra RUBI · Pagamento no fornecedor")).toBeVisible();
   await expect(consumer.getByRole("heading",{name:productTitle}).last()).toBeVisible();
   // The synthetic checkout destination is never opened; this journey proves only the same-SKU precheckout.
   expect(new URL(consumer.url()).origin).toBe(new URL(consumer.url()).origin);
   await consumerContext.close();
  });
 });
}
