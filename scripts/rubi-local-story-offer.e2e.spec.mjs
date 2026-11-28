import {test,expect} from "@playwright/test";
import {resolveRubiCheckoutAllowedHosts} from "./rubi-staging-story-target.mjs";

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
  test.use({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.name==="mobile",hasTouch:viewport.name==="mobile",deviceScaleFactor:viewport.name==="mobile"?2:1});
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


for(const viewport of [{name:"mobile",width:390,height:844},{name:"desktop",width:1366,height:768}]){
 test.describe(`RUBI Story persistido — bloqueio por ausência de direitos — ${viewport.name}`,()=>{
  test.use({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.name==="mobile",hasTouch:viewport.name==="mobile",deviceScaleFactor:viewport.name==="mobile"?2:1});
  test("Master não publica Story sem confirmação de direitos mesmo com produto e checkout elegíveis",async({page})=>{
   const rightsProductId=process.env.RUBI_QA_RIGHTS_PRODUCT_ID;
   const rightsStoryTitle=process.env.RUBI_QA_RIGHTS_STORY_TITLE;
   if(!rightsProductId||!rightsStoryTitle)throw new Error("Disposable rights-gate Story fixture environment is missing.");
   await signIn(page,"MASTER","/admin/hub-catalog");
   const storyAdmin=page.getByRole("region",{name:"RUBI Stories por produto"});
   await storyAdmin.getByLabel("Produto").selectOption(rightsProductId);
   const storyCard=storyAdmin.getByRole("button",{name:new RegExp(rightsStoryTitle)});
   await expect(storyCard).toBeVisible({timeout:20000});
   await storyCard.click();
   await expect(storyAdmin.getByText("Rascunho privado")).toBeVisible();
   const approve=storyAdmin.getByRole("button",{name:"Aprovar e publicar Story"});
   // The UI must fail closed: without confirmed rights, publication is disabled.
   // Do not click a disabled control and wait for a server toast that cannot occur.
   await expect(approve).toBeDisabled();
   await expect(storyAdmin.getByText("Rascunho privado")).toBeVisible();
   await expect(storyAdmin.getByText("Aprovado e visível")).toHaveCount(0);
  });
 });
}

for(const viewport of [{name:"mobile",width:390,height:844},{name:"desktop",width:1366,height:768}]){
 test.describe("RUBI Story aprovado → produto correspondente → tentativa de checkout oficial permitida — "+viewport.name,()=>{
  test("Master aprova Story e consumidor chega ao limite de navegação HTTPS do checkout autorizado",async({browser})=>{
   const approvedProductId=process.env.RUBI_QA_APPROVED_STORY_PRODUCT_ID;
   const approvedStoryTitle=process.env.RUBI_QA_APPROVED_STORY_TITLE;
   const productTitle=process.env.RUBI_QA_APPROVED_STORY_PRODUCT_TITLE;
   if(!approvedProductId||!approvedStoryTitle||!productTitle)throw new Error("Disposable approved Story fixture environment is missing.");
   const masterContext=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.name==="mobile",hasTouch:viewport.name==="mobile",deviceScaleFactor:viewport.name==="mobile"?2:1});
   const masterPage=await masterContext.newPage();
   await signIn(masterPage,"MASTER","/admin/hub-catalog");
   const storyAdmin=masterPage.getByRole("region",{name:"RUBI Stories por produto"});
   await storyAdmin.getByLabel("Produto").selectOption(approvedProductId);
   const storyCard=storyAdmin.getByRole("button",{name:new RegExp(approvedStoryTitle)});
   await expect(storyCard).toBeVisible({timeout:20000});

   // Mobile and desktop share one disposable database in this workflow. Publish once;
   // the second viewport must verify the already-persisted approved state instead.
   if(await storyCard.getByText("Rascunho privado").count()){
    await storyCard.click();
    await expect(storyAdmin.getByRole("button",{name:"Aprovar e publicar Story"})).toBeVisible();
    masterPage.once("dialog",dialog=>dialog.accept());
    await storyAdmin.getByRole("button",{name:"Aprovar e publicar Story"}).click();
    await expect(masterPage.locator('[data-sonner-toast][data-type="success"]').filter({hasText:/Story aprovado para exibição/i})).toBeVisible();
   }else{
    await expect(storyCard).toContainText("Aprovado e visível");
   }
   await masterContext.close();

   const consumerContext=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.name==="mobile",hasTouch:viewport.name==="mobile",deviceScaleFactor:viewport.name==="mobile"?2:1});
   const consumerPage=await consumerContext.newPage();
   await signIn(consumerPage,"CONSUMER","/hub-product/"+approvedProductId);
   const productPresentation=consumerPage.getByRole("region",{name:"Apresentação do produto"});
   await expect(productPresentation.getByRole("heading",{name:productTitle})).toBeVisible();
   const storySection=consumerPage.getByRole("region",{name:"Histórias e vídeos deste produto"});
   await expect(storySection.getByRole("heading",{name:approvedStoryTitle})).toBeVisible({timeout:20000});
   const offerLink=storySection.getByRole("link",{name:/Consultar preço e compra oficial/i});
   await expect(offerLink).toBeVisible();
   await offerLink.click();
   await expect(consumerPage).toHaveURL(new RegExp("/hub-product/"+approvedProductId+"#rubi-purchase$"));
   const checkoutButton=consumerPage.getByRole("button",{name:/Continuar para pagamento no fornecedor/i});
   await expect(checkoutButton).toBeEnabled({timeout:20000});
   await expect(consumerPage.getByText(/A RUBI não coleta dados do cartão nesta página/i)).toBeVisible();

   // Capture and abort the outbound request: prove the browser attempts the approved
   // provider redirect without sending a request to a real payment page or creating a session.
   const stagingOrigin=new URL(process.env.RUBI_STAGING_BASE_URL).origin;
   const allowedCheckoutHosts=resolveRubiCheckoutAllowedHosts();
   let outboundCheckout=null;
   await consumerPage.route("**/*",async route=>{
    const requestUrl=new URL(route.request().url());
    if(requestUrl.origin===stagingOrigin){await route.continue();return;}
    // Only a top-level document navigation proves the consumer is being redirected.
    // A fetch, XHR, image or other subresource to an allowlisted host must not pass.
    const request=route.request();
    if(request.isNavigationRequest()&&request.resourceType()==="document"&&requestUrl.protocol==="https:"&&allowedCheckoutHosts.includes(requestUrl.hostname.toLowerCase())&&!outboundCheckout)outboundCheckout=requestUrl;
    await route.abort();
   });
   await checkoutButton.click();
   await expect.poll(()=>outboundCheckout?.hostname??null,{timeout:10000}).not.toBeNull();
   expect(outboundCheckout.protocol).toBe("https:");
   expect(allowedCheckoutHosts).toContain(outboundCheckout.hostname.toLowerCase());
   expect(outboundCheckout.username).toBe("");
   expect(outboundCheckout.password).toBe("");
   // Query values and full destination are deliberately never written to test output.
   expect(outboundCheckout.hostname.length).toBeGreaterThan(0);
   await consumerContext.close();
  });
 });
}

for(const viewport of [{name:"mobile",width:390,height:844},{name:"desktop",width:1366,height:768}]){
 test.describe(`Consumidor não recebe Story cuja revisão do movimento ficou obsoleta — ${viewport.name}`,()=>{
  test.use({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.name==="mobile",hasTouch:viewport.name==="mobile",deviceScaleFactor:viewport.name==="mobile"?2:1});
  test("oculta a revisão obsoleta na experiência autenticada",async({page})=>{
  const approvedProductId=process.env.RUBI_QA_APPROVED_STORY_PRODUCT_ID;
  const staleTitle=process.env.RUBI_QA_STALE_STORY_TITLE;
  if(!approvedProductId||!staleTitle)throw new Error("Disposable stale-revision Story fixture environment is missing.");
  await signIn(page,"CONSUMER","/hub-product/"+approvedProductId);
  await expect(page.getByRole("heading",{name:process.env.RUBI_QA_APPROVED_STORY_TITLE})).toBeVisible({timeout:20000});
  await expect(page.getByRole("heading",{name:staleTitle})).toHaveCount(0);
 });
 });
}


for(const gate of [
 {key:"INACTIVE_PRODUCT",label:"produto inativo"},
 {key:"INACTIVE_SUPPLIER",label:"fornecedor inativo"}
]){
 for(const viewport of [{name:"mobile",width:390,height:844},{name:"desktop",width:1366,height:768}]){
  test.describe(`Master não publica Story com ${gate.label} — ${viewport.name}`,()=>{
   test.use({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.name==="mobile",hasTouch:viewport.name==="mobile",deviceScaleFactor:viewport.name==="mobile"?2:1});
   test("bloqueia publicação quando produto ou fornecedor está inativo",async({page})=>{
   const gateProductId=process.env[`RUBI_QA_${gate.key}_PRODUCT_ID`];
   const gateStoryTitle=process.env[`RUBI_QA_${gate.key}_STORY_TITLE`];
   if(!gateProductId||!gateStoryTitle)throw new Error(`Disposable ${gate.label} fixture environment is missing.`);
   await signIn(page,"MASTER","/admin/hub-catalog");
   const storyAdmin=page.getByRole("region",{name:"RUBI Stories por produto"});
   await storyAdmin.getByLabel("Produto").selectOption(gateProductId);
   const storyCard=storyAdmin.getByRole("button",{name:new RegExp(gateStoryTitle)});
   await expect(storyCard).toBeVisible({timeout:20000});
   await storyCard.click();
   await expect(storyAdmin.getByText("Rascunho privado")).toBeVisible();
   const approve=storyAdmin.getByRole("button",{name:"Aprovar e publicar Story"});
   await expect(approve).toBeEnabled();
   page.once("dialog",dialog=>dialog.accept());
   await approve.click();
   await expect(page.locator('[data-sonner-toast][data-type="error"]')).toContainText(/checkout oficial aprovado e fornecedor ativo/i);
   await expect(storyAdmin.getByText("Rascunho privado")).toBeVisible();
   await expect(storyAdmin.getByText("Aprovado e visível")).toHaveCount(0);
  });
 });
 }
}
