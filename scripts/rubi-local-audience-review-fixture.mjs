import {createClient} from "@supabase/supabase-js";
import {appendFile} from "node:fs/promises";

const url=process.env.SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const masterId=process.env.RUBI_QA_MASTER_USER_ID;
const productId=process.env.RUBI_QA_APPROVED_STORY_PRODUCT_ID;
const envFile=process.env.GITHUB_ENV;
if(!url||!serviceKey||!masterId||!productId||!envFile)throw new Error("Disposable local Supabase, Master, product and GITHUB_ENV are required.");
if(!["127.0.0.1","localhost","::1"].includes(new URL(url).hostname))throw new Error("Refusing audience-review fixtures outside local Supabase.");
const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await db.rpc("rubi_mutate_movement_audited",{
 p_action:"create",p_id:null,p_product_id:productId,p_expected_revision:null,p_actor:masterId,
 p_values:{
  name:"RUBI QA — revisão de evidência",
  audience:"consumer",
  buyer_persona:"Pessoa adulta avaliando uma oferta sintética em ambiente local de teste.",
  problem:"Precisa entender as características descritas antes de decidir se deseja conhecer a oferta.",
  desired_outcome:"Consultar informações claras e verificáveis sobre o produto.",
  truthful_promise:"A ficha técnica descreve somente características fornecidas pelo fabricante.",
  differentiator:"Registro documental sintético, privado e isolado para testar revisão Master.",
  narrative:"Fixture automatizada para comprovar autorização, controle de versão, trilha auditável e rollback da revisão documental.",
  evidence_notes:[
   "[VALIDAÇÃO DECLARADA — REVISÃO HUMANA PENDENTE]",
   "Fonte: Ficha técnica sintética de QA local do produto",
   "Data: "+new Date().toISOString().slice(0,10),
   "Método: Revisão documental automatizada em banco local descartável",
   "Observação: O teste confere somente a consistência estrutural do registro",
   "Contraevidência/limites: Fixture não representa pesquisa nem aceitação de consumidores",
   "Hipótese: A clareza da ficha pode ajudar a explicar características do produto"
  ].join("\n"),
  status:"draft"
 }
});
if(error)throw new Error("Could not create disposable movement: "+error.message);
const movementId=data?.[0]?.id;
if(!movementId)throw new Error("Disposable audience evidence movement was not created.");
const {data:movement,error:movementError}=await db.from("rubi_movements")
 .select("id,revision").eq("id",movementId).maybeSingle();
if(movementError)throw new Error("Could not verify disposable movement revision: "+movementError.message);
if(!movement||!Number.isInteger(Number(movement.revision)))throw new Error("Disposable audience evidence movement has no valid revision.");
const {data:product,error:productError}=await db.from("hub_products").select("title").eq("id",productId).maybeSingle();
if(productError||!product?.title)throw new Error("Could not resolve the local QA product title for the Master UI journey.");
await appendFile(envFile,
 "RUBI_QA_AUDIENCE_REVIEW_MOVEMENT_ID="+movement.id+"\n"+
 "RUBI_QA_AUDIENCE_REVIEW_REVISION="+movement.revision+"\n"+
 "RUBI_QA_AUDIENCE_REVIEW_PRODUCT_TITLE="+product.title.replace(/[\r\n]/g," ")+"\n"+
 "RUBI_QA_AUDIENCE_REVIEW_MOVEMENT_NAME=RUBI QA — revisão de evidência\n",
 {encoding:"utf8",mode:0o600});
process.stdout.write("Disposable audience-evidence review movement created in local Supabase; no production data used.\n");
