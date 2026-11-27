import assert from "node:assert/strict";
import {createClient} from "@supabase/supabase-js";

const url=process.env.SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const actor=process.env.RUBI_QA_MASTER_USER_ID;
const productId=process.env.RUBI_QA_APPROVED_STORY_PRODUCT_ID;
if(!url||!serviceKey||!actor||!productId)throw new Error("Disposable local Supabase, Master and approved product fixtures are required.");
if(!["127.0.0.1","localhost","::1"].includes(new URL(url).hostname))throw new Error("Refusing to run publication-reference smoke outside local Supabase.");
const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const run=(process.env.GITHUB_RUN_ID||"local").replace(/[^a-zA-Z0-9]/g,"").slice(0,24);
const movementRows=await db.from("rubi_movements").select("id").eq("product_id",productId)
 .eq("name","Movimento QA aprovado consumidor").limit(1);
if(movementRows.error)throw movementRows.error;
assert.equal(movementRows.data?.length,1,"Expected exactly one reviewed movement fixture.");
const movementId=movementRows.data[0].id;
const valid={
 instagram:"https://www.instagram.com/p/ABC123xyz/",
 tiktok:"https://www.tiktok.com/@rubi/video/1234567890123456789",
 youtube:"https://www.youtube.com/watch?v=AbCdEf12345",
 facebook:"https://www.facebook.com/rubi/posts/123456789",
 pinterest:"https://www.pinterest.com/pin/123456789012345678/",
 telegram:"https://t.me/rubichannel/123",
};
const invalid={
 instagram:"https://instagram.com.evil.example/p/ABC123xyz/",
 tiktok:"http://www.tiktok.com/@rubi/video/1234567890123456789",
 youtube:"https://youtube.com.evil.example/watch?v=AbCdEf12345",
 facebook:"https://www.facebook.com/profile.php?id=123",
 pinterest:"https://www.pinterest.com.evil.example/pin/123456789012345678/",
 telegram:"https://t.me/rubichannel",
 whatsapp:"https://chat.whatsapp.com/InviteCode123",
};
async function required(promise,label){
 const {data,error}=await promise;
 if(error)throw new Error(label+": "+error.message);
 return data;
}
async function createVariant(channel){
 const {data,error}=await db.rpc("rubi_mutate_variant_audited",{
  p_action:"create",p_id:null,p_movement_id:movementId,p_expected_revision:null,p_actor:actor,
  p_values:{
   name:"RUBI QA permalink "+channel+" "+run,format:"short_video",
   creative_hook:"Gancho sintético de QA",creative_script:"Roteiro sintético para teste de permalink.",
   page_headline:"Página QA",page_body:"Conteúdo de teste local.",
   call_to_action:"Conhecer",media_notes:"Fixture sintética",proof_notes:"Sem alegações comerciais",
   media_rights_confirmed:true,status:"review"
  }
 });
 if(error)throw new Error("Create reviewed variant: "+error.message);
 const variantId=data?.[0]?.variant_id;
 if(!variantId)throw new Error("Variant mutation returned no ID.");
 return variantId;
}
async function createPlan(channel,variantId){
 const campaign=("qa-pub-"+channel+"-"+run).slice(0,60);
 const {data,error}=await db.rpc("rubi_save_distribution_audited",{
  p_id:null,p_variant_id:variantId,p_expected_revision:null,p_channel:channel,
  p_campaign:campaign,p_status:"planned",p_notes:"Fixture local de referência de publicação",
  p_published_reference:"",p_actor:actor
 });
 if(error)throw new Error("Create planned distribution: "+error.message);
 const row=data?.[0];
 if(!row?.plan_id)throw new Error("Distribution RPC returned no plan ID.");
 return {id:row.plan_id,revision:row.new_revision};
}
async function updatePlan(plan,variantId,channel,reference){
 return db.rpc("rubi_save_distribution_audited",{
  p_id:plan.id,p_variant_id:variantId,p_expected_revision:plan.revision,
  p_channel:channel,p_campaign:("qa-pub-"+channel+"-"+run).slice(0,60),
  p_status:"manually_published",p_notes:"Fixture local de validação de referência",
  p_published_reference:reference,p_actor:actor
 });
}
for(const channel of Object.keys(invalid)){
 const variantId=await createVariant(channel);
 const plan=await createPlan(channel,variantId);
 const rejected=await updatePlan(plan,variantId,channel,invalid[channel]);
 assert.ok(rejected.error,"Invalid "+channel+" reference must be rejected by the database trigger.");
 assert.match(rejected.error.message,/platform-specific HTTPS publication permalink/i);
 const saved=await required(db.from("rubi_movement_distribution").select("status,published_reference")
  .eq("id",plan.id).single(),"Read rejected plan");
 assert.equal(saved.status,"planned","Rejected reference must not change publication state.");
 assert.equal(saved.published_reference,"","Rejected reference must not persist.");
 if(valid[channel]){
  const accepted=await updatePlan(plan,variantId,channel,valid[channel]);
  if(accepted.error)throw new Error("Valid "+channel+" permalink rejected: "+accepted.error.message);
  const confirmed=await required(db.from("rubi_movement_distribution").select("status,published_reference")
   .eq("id",plan.id).single(),"Read accepted plan");
  assert.equal(confirmed.status,"manually_published");
  assert.equal(confirmed.published_reference,valid[channel]);
 }
}
console.log("PASS: database trigger accepts platform permalinks, rejects spoofed/non-HTTPS references, blocks WhatsApp manual claims, and preserves planned state on rejection.");
