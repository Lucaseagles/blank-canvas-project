import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {canReviewRubiVariant,type RubiMovementVariant} from "./rubi-movement-variants";
import {canReviewRubiMovement,type RubiMovement} from "./rubi-movements";
import {approvedRubiCheckout} from "./rubi-checkout-validation";

const uuid=z.string().uuid();
const origin=z.object({productId:uuid,channel:z.enum(["instagram","tiktok","youtube","facebook","pinterest","whatsapp","telegram"]),campaign:z.string().regex(/^[a-z0-9][a-z0-9_-]{0,59}$/)});
const publication=z.object({planId:uuid,publish:z.boolean(),confirmedEvidence:z.boolean()});
const db=async()=>{const {supabaseAdmin}=await import("@/integrations/supabase/client.server");return supabaseAdmin as any;};
const productFields="id,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)";

/** Require current source content, explicit evidence and supplier checkout. Never publish draft claims. */
export const setRubiMovementPagePublishedAdmin=createServerFn({method:"POST"})
.middleware([requireOwnerRole]).validator((input:unknown)=>publication.parse(input))
.handler(async({data})=>{
 const admin=await db();
 const {data:plan,error:planError}=await admin.from("rubi_movement_distribution")
 .select("id,variant_id,page_published_at").eq("id",data.planId).maybeSingle();
 if(planError)throw planError;
 if(!plan)throw new Error("Plano de campanha não encontrado.");
 if(!data.publish){
  const {error}=await admin.from("rubi_movement_distribution")
   .update({page_published_at:null,published_variant_revision:null,published_movement_revision:null,updated_at:new Date().toISOString()})
   .eq("id",plan.id);
  if(error)throw error;
  return {success:true};
 }
 if(data.confirmedEvidence!==true)throw new Error("Confirme revisão, alegações e direitos antes de publicar.");
 const {data:variant,error:variantError}=await admin.from("rubi_movement_variants")
  .select("*").eq("id",plan.variant_id).maybeSingle();
 if(variantError)throw variantError;
 if(!variant||variant.status!=="review"||!canReviewRubiVariant(variant as RubiMovementVariant))
  throw new Error("Criativo ou página ainda não revisado.");
 const {data:movement,error:movementError}=await admin.from("rubi_movements")
  .select("*").eq("id",variant.movement_id).maybeSingle();
 if(movementError)throw movementError;
 if(!movement||movement.status!=="review"||movement.audience!=="consumer"||!canReviewRubiMovement(movement as RubiMovement))
  throw new Error("Movimento de consumidor não está pronto para revisão.");
 const {data:product,error:productError}=await admin.from("hub_products")
  .select(productFields).eq("id",movement.product_id).maybeSingle();
 if(productError)throw productError;
 if(!product?.active||Number(product.retail_price)<=0||!approvedRubiCheckout(product))
  throw new Error("O produto precisa estar ativo e com checkout oficial validado.");
 // A unique partial index blocks conflicting published paths from different creatives.
 const {error}=await admin.from("rubi_movement_distribution").update({
  page_published_at:new Date().toISOString(),
  published_variant_revision:variant.revision,
  published_movement_revision:movement.revision,
  updated_at:new Date().toISOString(),
 }).eq("id",plan.id).eq("variant_id",variant.id);
 if(error)throw error;
 return {success:true};
});

/** Public response contains only approved presentation copy, never customer identifiers or source notes. */
export const getRubiMovementPublishedPage=createServerFn({method:"POST"})
.validator((input:unknown)=>origin.parse(input)).handler(async({data})=>{
 const admin=await db();
 const {data:product,error:productError}=await admin.from("hub_products")
  .select(productFields).eq("id",data.productId).maybeSingle();
 if(productError)throw productError;
 if(!product?.active||Number(product.retail_price)<=0||!approvedRubiCheckout(product))return null;
 const {data:plan,error:planError}=await admin.from("rubi_movement_distribution")
  .select("variant_id,published_variant_revision,published_movement_revision")
  .eq("channel",data.channel).eq("campaign",data.campaign)
  .not("page_published_at","is",null).maybeSingle();
 if(planError)throw planError;
 if(!plan)return null;
 const {data:variant,error:variantError}=await admin.from("rubi_movement_variants")
  .select("id,movement_id,revision,status,page_headline,page_body,call_to_action")
  .eq("id",plan.variant_id).maybeSingle();
 if(variantError)throw variantError;
 if(!variant||variant.status!=="review"||variant.revision!==plan.published_variant_revision)return null;
 const {data:movement,error:movementError}=await admin.from("rubi_movements")
  .select("id,product_id,revision,status,audience,truthful_promise")
  .eq("id",variant.movement_id).maybeSingle();
 if(movementError)throw movementError;
 if(!movement||movement.product_id!==data.productId||movement.status!=="review"||movement.audience!=="consumer"||
    movement.revision!==plan.published_movement_revision)return null;
 return {headline:variant.page_headline,body:variant.page_body,callToAction:variant.call_to_action,
  promise:movement.truthful_promise};
});
