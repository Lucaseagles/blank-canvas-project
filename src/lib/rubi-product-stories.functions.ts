import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {approvedRubiCheckout} from "./rubi-checkout-validation";
import {canApproveRubiProductStory,canServeVersionedRubiStory,validRubiStoryMediaUrl,type RubiProductStory} from "./rubi-product-stories";
const uuid=z.string().uuid();
const schema=z.object({
 id:uuid.optional(),product_id:uuid,movement_id:uuid.nullable(),title:z.string().trim().min(3).max(160),
 description:z.string().trim().max(1200),video_url:z.string().trim().min(14).max(2000),
 poster_url:z.string().trim().max(2000).nullable(),
 evidence_notes:z.string().trim().max(1200),rights_confirmed:z.boolean(),
 position:z.number().int().min(0).max(1000),
 revision:z.number().int().positive().optional(),
});
const storyFields="id,product_id,title,description,video_url,poster_url,evidence_notes,rights_confirmed,position,status,revision,movement_id,approved_movement_revision";
export const listRubiProductStoriesAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({productId:uuid}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).from("rubi_product_stories").select(storyFields)
   .eq("product_id",data.productId).order("position").limit(100);
  if(error)throw error;
  return (rows??[]) as RubiProductStory[];
 });
export const saveRubiProductStoryAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>schema.parse(input))
 .handler(async({data})=>{
  if(!validRubiStoryMediaUrl(data.video_url,"video"))throw new Error("Informe URL HTTPS direta de vídeo .mp4 ou .webm.");
  if(data.poster_url&&!validRubiStoryMediaUrl(data.poster_url,"poster"))throw new Error("Imagem de capa deve ser HTTPS .jpg, .png ou .webp.");
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:product,error:productError}=await db.from("hub_products").select("id").eq("id",data.product_id).maybeSingle();
  if(productError)throw productError;
  if(!product)throw new Error("Produto inexistente.");
  const {id,revision,...values}=data;
  if(id){
   const {data:old,error:oldError}=await db.from("rubi_product_stories").select("id,product_id,revision").eq("id",id).maybeSingle();
   if(oldError)throw oldError;
   if(!old||old.product_id!==data.product_id||old.revision!==revision)throw new Error("Story não pertence ao produto ou versão foi alterada.");
   const {data:updated,error}=await db.from("rubi_product_stories")
    .update({...values,status:"draft",approved_movement_revision:null,revision:old.revision+1,updated_at:new Date().toISOString()})
    .eq("id",id).eq("product_id",data.product_id).eq("revision",old.revision).select("id,revision").maybeSingle();
   if(error)throw error;
   if(!updated)throw new Error("Conflito de edição.");
   return updated as {id:string;revision:number};
  }
  const {data:created,error}=await db.from("rubi_product_stories")
   .insert({...values,status:"draft"}).select("id,revision").single();
  if(error)throw error;
  return created as {id:string;revision:number};
 });
export const setRubiProductStoryApprovalAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({id:uuid,productId:uuid,revision:z.number().int().positive(),approved:z.boolean(),confirmedEvidence:z.boolean()}).parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:story,error}=await db.from("rubi_product_stories").select(storyFields)
   .eq("id",data.id).eq("product_id",data.productId).maybeSingle();
  if(error)throw error;
  if(!story||story.revision!==data.revision)throw new Error("Story desatualizada. Recarregue antes de aprovar.");
  if(data.approved){
   if(!data.confirmedEvidence||!canApproveRubiProductStory(story as RubiProductStory))
    throw new Error("Conclua evidências e direitos de uso antes de aprovar.");
   const {data:product,error:productError}=await db.from("hub_products")
    .select("id,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
    .eq("id",data.productId).maybeSingle();
   if(productError)throw productError;
   if(!product?.active||Number(product.retail_price)<=0||!approvedRubiCheckout(product))
    throw new Error("Para publicar Story, o produto precisa ter checkout oficial aprovado e fornecedor ativo.");
   if(!story.movement_id)throw new Error("Vincule um movimento comercial antes de aprovar o Story.");
   const {data:movement,error:movementError}=await db.from("rubi_movements")
    .select("id,product_id,status,audience,revision")
    .eq("id",story.movement_id).eq("product_id",data.productId).maybeSingle();
   if(movementError)throw movementError;
   if(!movement||movement.status!=="review"||movement.audience!=="consumer")
    throw new Error("O Story exige movimento revisado do público consumidor e do mesmo produto.");
  }
  const {data:pinned,error:pinnedError}=data.approved
   ?await db.from("rubi_movements").select("revision").eq("id",story.movement_id).eq("product_id",data.productId).eq("status","review").maybeSingle()
   :{data:null,error:null};
  if(pinnedError)throw pinnedError;
  if(data.approved&&!pinned)throw new Error("O movimento perdeu a revisão antes da aprovação.");
  // DB function commits approval and the sanitized Owner audit record atomically.
  // If the audit insert fails, the Story status is rolled back.
  const {error:updateError}=await db.rpc("rubi_set_story_approval_audited",{
   p_story_id:data.id,p_product_id:data.productId,
   p_expected_revision:data.revision,p_approved:data.approved,
   p_actor:context.userId
  });
  if(updateError)throw updateError;
  return {success:true};
 });
export const listRubiApprovedProductStories=createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({productId:uuid}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:product,error:productError}=await db.from("hub_products")
   .select("id,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
   .eq("id",data.productId).maybeSingle();
  if(productError)throw productError;
  if(!product?.active||Number(product.retail_price)<=0||!approvedRubiCheckout(product))return [];
  const {data:rows,error}=await db.from("rubi_product_stories")
   .select("id,title,description,video_url,poster_url,movement_id,approved_movement_revision,status,rights_confirmed").eq("product_id",data.productId)
   .eq("status","approved").eq("rights_confirmed",true).not("movement_id","is",null).order("position").limit(51);
  if(error)throw error;
  // Fail closed if an upper bound could conceal a more recently eligible Story.
  if((rows??[]).length>50)return [];
  const movementIds=[...new Set((rows??[]).map((row:{movement_id:string})=>row.movement_id))];
  if(!movementIds.length)return [];
  const {data:movements,error:movementsError}=await db.from("rubi_movements")
   .select("id,product_id,status,audience,revision").in("id",movementIds).eq("product_id",data.productId);
  if(movementsError)throw movementsError;
  const byId=new Map<string,{id:string;product_id:string;status:string;audience:string;revision:number}>(
   (movements??[]).map((m:{id:string;product_id:string;status:string;audience:string;revision:number})=>[m.id,m])
  );
  return (rows??[]).filter((story:{movement_id:string;approved_movement_revision:number;status:string;rights_confirmed:boolean})=>
   canServeVersionedRubiStory(story,byId.get(story.movement_id)??null,data.productId))
   .slice(0,6).map((story:{id:string;title:string;description:string;video_url:string;poster_url:string|null})=>({
    id:story.id,title:story.title,description:story.description,video_url:story.video_url,poster_url:story.poster_url
   }));
 });
