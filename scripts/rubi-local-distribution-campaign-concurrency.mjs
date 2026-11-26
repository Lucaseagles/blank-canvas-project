import assert from "node:assert/strict";
import {createClient} from "@supabase/supabase-js";

const url=process.env.SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const actor=process.env.RUBI_QA_MASTER_USER_ID;
const productId=process.env.RUBI_QA_APPROVED_STORY_PRODUCT_ID;
if(!url||!serviceKey||!actor||!productId)throw new Error("Disposable local Supabase, Master and approved product fixtures are required.");
if(!["127.0.0.1","localhost","::1"].includes(new URL(url).hostname))throw new Error("Refusing to run distribution concurrency smoke outside local Supabase.");
const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const run=(process.env.GITHUB_RUN_ID||"local").replace(/[^a-zA-Z0-9]/g,"");
const campaign=("qa-concurrency-"+run).slice(0,60);
async function required(query,label){const {data,error}=await query;if(error)throw new Error(label+": "+error.message);return data;}
const movements=await required(db.from("rubi_movements").select("id").eq("product_id",productId).eq("name","Movimento QA aprovado consumidor").limit(1),"Find reviewed movement");
assert.equal(movements.length,1,"Expected exactly one reviewed movement fixture.");
const movementId=movements[0].id;
async function createVariant(name){
 const {data,error}=await db.rpc("rubi_mutate_variant_audited",{
  p_action:"create",p_id:null,p_movement_id:movementId,p_expected_revision:null,p_actor:actor,
  p_values:{
   name,format:"short_video",creative_hook:"Gancho sintético de QA",
   creative_script:"Roteiro sintético usado exclusivamente para validar concorrência.",
   page_headline:"Página de teste",page_body:"Conteúdo de teste local.",
   call_to_action:"Conhecer",media_notes:"Fixture sintética",proof_notes:"Sem alegações comerciais",
   media_rights_confirmed:true,status:"review"
  }
 });
 if(error)throw new Error("Create reviewed QA variant: "+error.message);
 const row=data?.[0];if(!row?.variant_id)throw new Error("Variant RPC returned no identifier.");
 return row.variant_id;
}
const [variantA,variantB]=await Promise.all([
 createVariant("RUBI QA concurrency A "+run),
 createVariant("RUBI QA concurrency B "+run)
]);
async function save(variantId){
 return db.rpc("rubi_save_distribution_audited",{
  p_id:null,p_variant_id:variantId,p_expected_revision:null,
  p_channel:"instagram",p_campaign:campaign,p_status:"planned",
  p_notes:"Concorrência sintética isolada",p_published_reference:"",p_actor:actor
 });
}
const outcomes=await Promise.all([save(variantA),save(variantB)]);
const successes=outcomes.filter(x=>!x.error);
const conflicts=outcomes.filter(x=>x.error?.code==="P0001" && /Campaign label already in use by this product and channel/.test(x.error.message||""));
assert.equal(successes.length,1,"Exactly one concurrent campaign claim must succeed.");
assert.equal(conflicts.length,1,"The competing claim must be rejected by the existing trigger with its exact collision error.");
const saved=successes[0].data?.[0];
assert.ok(saved?.plan_id,"Winning RPC must return the persisted plan identifier.");
const rows=await required(db.from("rubi_movement_distribution").select("id,variant_id").eq("channel","instagram").eq("campaign",campaign),"Verify unique campaign row");
assert.equal(rows.length,1,"Exactly one distribution row may own a product/channel/campaign key.");
assert.equal(rows[0].id,saved.plan_id,"Persisted row must match winning RPC result.");
const {count:auditCount,error:auditError}=await db.from("admin_audit_log").select("id",{count:"exact",head:true})
 .eq("entity_id",saved.plan_id).eq("action_type","RUBI_DISTRIBUTION_CREATED");
if(auditError)throw new Error("Verify atomic audit event: "+auditError.message);
assert.equal(auditCount,1,"Winning transaction must persist exactly one matching audit event.");
