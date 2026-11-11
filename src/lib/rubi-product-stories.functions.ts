import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {approvedRubiCheckout} from "./rubi-checkout-validation";
import {canApproveRubiProductStory,validRubiStoryMediaUrl,type RubiProductStory} from "./rubi-product-stories";
const uuid=z.string().uuid();
const schema=z.object({
 id:uuid.optional(),product_id:uuid,title:z.string().trim().min(3).max(160),
 description:z.string().trim().max(1200),video_url:z.string().trim().min(14).max(2000),
 poster_url:z.string().trim().max(2000).nullable(),
 evidence_notes:z.string().trim().max(1200),rights_confirmed:z.boolean(),
 position:z.number().int().min(0).max(1000),
 revision:z.number().int().positive().optional(),
});
const storyFields="id,product_id,title,description,video_url,poster_url,evidence_notes,rights_confirmed,position,status,revision";
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
    .update({...values,status:"draft",revision:old.revision+1,updated_at:new Date().toISOString()})
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
 .handler(async({data})=>{
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
  }
  const {data:updated,error:updateError}=await db.from("rubi_product_stories")
   .update({status:data.approved?"approved":"draft",updated_at:new Date().toISOString(),revision:story.revision+1})
   .eq("id",data.id).eq("product_id",data.productId).eq("revision",data.revision).select("id").maybeSingle();
  if(updateError)throw updateError;
  if(!updated)throw new Error("Story alterada em outra sessão.");
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
   .select("id,title,description,video_url,poster_url").eq("product_id",data.productId)
   .eq("status","approved").eq("rights_confirmed",true).order("position").limit(6);
  if(error)throw error;
  return (rows??[]) as Array<{id:string;title:string;description:string;video_url:string;poster_url:string|null}>;
 });
