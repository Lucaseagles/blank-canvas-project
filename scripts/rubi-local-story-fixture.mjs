import {createClient} from "@supabase/supabase-js";
import {appendFile} from "node:fs/promises";
import {randomBytes} from "node:crypto";

const url=process.env.SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const masterId=process.env.RUBI_QA_MASTER_USER_ID;
const envFile=process.env.GITHUB_ENV;
if(!url||!serviceKey||!masterId||!envFile)throw new Error("Local Supabase, disposable Master and GITHUB_ENV are required.");
if(!["127.0.0.1","localhost","::1"].includes(new URL(url).hostname))throw new Error("Refusing Story fixtures outside local Supabase.");
const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const run=(process.env.GITHUB_RUN_ID||randomBytes(6).toString("hex")).replace(/[^a-zA-Z0-9]/g,"");
async function setEnv(key,value){if(/[\r\n]/.test(String(value)))throw new Error("Invalid fixture environment value.");await appendFile(envFile,`${key}=${value}\n`,{encoding:"utf8",mode:0o600});}
async function rpc(name,args){const {data,error}=await db.rpc(name,args);if(error)throw new Error(`${name} failed: ${error.message}`);return data;}
const supplierName=`RUBI QA Story Supplier ${run}`;
const host="checkout.rubi-qa.example.test";
const supplierRows=await rpc("rubi_save_supplier_audited",{p_id:null,p_revision:null,p_name:supplierName,p_mode:"supplier",p_active:true,p_host:host,p_actor:masterId});
const supplierId=supplierRows?.[0]?.saved_id;
if(!supplierId)throw new Error("Disposable Story supplier was not created.");
const productTitle=`RUBI QA Story Product ${run}`;
const checkoutUrl=`https://${host}/local-only-no-payment`;
const productRows=await rpc("rubi_save_hub_product_audited",{p_id:null,p_expected_revision:null,p_actor:masterId,p_values:{
 supplier_id:supplierId,title:productTitle,description:"Produto sintético exclusivo do teste local Story para oferta.",image_url:null,
 category:"QA local",sku:`RUBI-QA-STORY-${run}`,retail_price:19.9,supplier_cost:8,b2b_base_price:null,
 min_b2b_quantity:1,active:true,checkout_url:checkoutUrl,checkout_verified:true
}});
const productId=productRows?.[0]?.product_id;
if(!productId)throw new Error("Disposable Story product was not created.");
const movementRows=await rpc("rubi_mutate_movement_audited",{p_action:"create",p_id:null,p_product_id:productId,p_expected_revision:null,p_actor:masterId,p_values:{
 name:"Movimento QA consumidor",audience:"consumer",buyer_persona:"Pessoa avaliando uma oferta de demonstração em ambiente isolado.",
 problem:"Precisa conferir a apresentação do produto antes de decidir se deseja conhecer a oferta.",
 desired_outcome:"Visualizar a história do produto e chegar à mesma oferta oficial da vitrine.",
 truthful_promise:"O Story apresenta somente informações sintéticas de teste, sem alegações de resultado comercial.",
 differentiator:"Percurso automatizado e descartável, separado de clientes e dados reais.",
 narrative:"Jornada sintética de qualidade para verificar a exibição do Story aprovado e a navegação até a pré-compra do produto correspondente.",
 evidence_notes:"Dados fictícios criados exclusivamente no Supabase local descartável para validação automatizada.",status:"review"
}});
const movementId=movementRows?.[0]?.id;
if(!movementId)throw new Error("Disposable reviewed movement was not created.");
const storyRows=await rpc("rubi_save_story_draft_audited",{p_actor:masterId,p_id:null,p_expected_revision:null,p_product:productId,p_movement:movementId,
 p_title:"Story de validação da jornada RUBI",p_description:"Conteúdo sintético de QA para validar a navegação do Story até a oferta correspondente no ambiente local isolado.",
 p_video_url:"https://cdn.example.test/rubi-qa-story.mp4",p_poster_url:null,
 p_evidence:"Mídia e direitos fictícios exclusivamente para teste automatizado local.",p_rights:true,p_position:0
});
const storyId=storyRows?.[0]?.saved_id;
if(!storyId)throw new Error("Disposable Story draft was not created.");
await setEnv("RUBI_QA_STORY_PRODUCT_ID",productId);
await setEnv("RUBI_QA_STORY_ID",storyId);
await setEnv("RUBI_QA_STORY_TITLE","Story de validação da jornada RUBI");
await setEnv("RUBI_QA_STORY_PRODUCT_TITLE",productTitle);
process.stdout.write("Disposable supplier, verified-format product, reviewed consumer movement and private Story draft created in local Supabase. No purchase or payment was performed.\n");
