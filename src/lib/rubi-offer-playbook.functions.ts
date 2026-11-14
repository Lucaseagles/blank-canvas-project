import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { RUBI_OFFER_CHANNELS, rubiOfferReadiness, type RubiOfferPlaybook } from "./rubi-offer-playbook";
import { approvedRubiCheckout } from "./rubi-checkout-validation";

const channels = z.enum(["instagram","tiktok","rubi_feed","whatsapp","telegram","partners","organic_pages","email"]);
const playbookSchema = z.object({
  product_id: z.string().uuid(),
  audience: z.enum(["consumer","merchant","partner"]),
  promise: z.string().trim().max(400),
  verified_benefits: z.string().trim().max(2000),
  proof_notes: z.string().trim().max(1500),
  creative_hook: z.string().trim().max(280),
  creative_script: z.string().trim().max(2000),
  page_headline: z.string().trim().max(240),
  page_body: z.string().trim().max(4000),
  objections: z.string().trim().max(1800),
  movement_plan: z.string().trim().max(3000),
  channels: z.array(channels).max(RUBI_OFFER_CHANNELS.length).refine(items => new Set(items).size === items.length, "Canais repetidos."),
  stage: z.enum(["draft","ready_for_review"]),
  revision:z.number().int().positive().nullable().optional(),
});
export const getRubiOfferPlaybookAdmin = createServerFn({method:"POST"})
  .middleware([requireOwnerRole])
  .validator((value:unknown) => z.object({productId:z.string().uuid()}).parse(value))
  .handler(async ({data}) => {
    const {supabaseAdmin} = await import("@/integrations/supabase/client.server");
    const {data:row,error} = await (supabaseAdmin as any).from("rubi_offer_playbooks")
      .select("product_id,audience,promise,verified_benefits,proof_notes,creative_hook,creative_script,page_headline,page_body,objections,movement_plan,channels,stage,published_at,revision")
      .eq("product_id",data.productId).maybeSingle();
    if(error) throw error;
    return row;
  });
export const saveRubiOfferPlaybookAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((value:unknown)=>playbookSchema.parse(value))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_save_offer_playbook_audited",{
   p_actor:context.userId,p_product:data.product_id,p_expected_revision:data.revision??null,
   p_audience:data.audience,p_promise:data.promise,p_benefits:data.verified_benefits,
   p_proof:data.proof_notes,p_hook:data.creative_hook,p_script:data.creative_script,
   p_headline:data.page_headline,p_body:data.page_body,p_objections:data.objections,
   p_movement:data.movement_plan,p_channels:data.channels,p_stage:data.stage
  });
  if(error)throw error;
  if(!rows?.[0]?.saved_revision)throw new Error("Plano e auditoria não registrados.");
  return {success:true,revision:Number(rows[0].saved_revision)};
 });
/** Publishing is a distinct owner-only action: editing a playbook always unpublishes it. */
export const publishRubiOfferPlaybookAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((value:unknown)=>z.object({productId:z.string().uuid(),confirmedEvidence:z.literal(true),expectedRevision:z.number().int().positive()}).parse(value))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:offer,error:readError}=await db.from("rubi_offer_playbooks").select("*").eq("product_id",data.productId).maybeSingle();
  if(readError)throw readError;
  if(!offer||offer.revision!==data.expectedRevision||offer.stage!=="ready_for_review"||offer.audience!=="consumer"||rubiOfferReadiness(offer as RubiOfferPlaybook).score!==100)
   throw new Error("Ficha mudou ou não está pronta para publicação.");
  const {data:product,error:productError}=await db.from("hub_products")
   .select("id,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
   .eq("id",data.productId).maybeSingle();
  if(productError)throw productError;
  if(!product?.active||Number(product.retail_price)<=0||!approvedRubiCheckout(product))throw new Error("Checkout oficial ainda não validado.");
  const {error}=await db.rpc("rubi_set_offer_playbook_publication_audited",{
   p_actor:context.userId,p_product:data.productId,p_expected_revision:data.expectedRevision,
   p_publish:true,p_evidence:data.confirmedEvidence
  });
  if(error)throw error;
  return {success:true};
 });
export const unpublishRubiOfferPlaybookAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((value:unknown)=>z.object({productId:z.string().uuid(),expectedRevision:z.number().int().positive()}).parse(value))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {error}=await (supabaseAdmin as any).rpc("rubi_set_offer_playbook_publication_audited",{
   p_actor:context.userId,p_product:data.productId,p_expected_revision:data.expectedRevision,
   p_publish:false,p_evidence:false
  });
  if(error)throw error;
  return {success:true};
 });
/** Public-safe editorial data; never returns internal notes, cost, checkout URL or merchant campaigns. */
export const getRubiPublishedOffer = createServerFn({method:"POST"})
  .validator((value:unknown)=>z.object({productId:z.string().uuid()}).parse(value))
  .handler(async ({data})=>{
    const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
    const {data:product,error:productError}=await (supabaseAdmin as any).from("hub_products")
      .select("id,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
      .eq("id",data.productId).maybeSingle();
    if(productError) throw productError;
    if(!product || !product.active || Number(product.retail_price)<=0 || !approvedRubiCheckout(product)) return null;
    const {data:offer,error}=await (supabaseAdmin as any).from("rubi_offer_playbooks")
      .select("product_id,promise,verified_benefits,page_headline,page_body,objections")
      .eq("product_id",data.productId).eq("audience","consumer").eq("stage","ready_for_review")
      .not("published_at","is",null).maybeSingle();
    if(error) throw error;
    return offer as null | { product_id:string; promise:string; verified_benefits:string; page_headline:string; page_body:string; objections:string };
  });
