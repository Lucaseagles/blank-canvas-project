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
});
export const getRubiOfferPlaybookAdmin = createServerFn({method:"POST"})
  .middleware([requireOwnerRole])
  .validator((value:unknown) => z.object({productId:z.string().uuid()}).parse(value))
  .handler(async ({data}) => {
    const {supabaseAdmin} = await import("@/integrations/supabase/client.server");
    const {data:row,error} = await (supabaseAdmin as any).from("rubi_offer_playbooks")
      .select("product_id,audience,promise,verified_benefits,proof_notes,creative_hook,creative_script,page_headline,page_body,objections,movement_plan,channels,stage,published_at")
      .eq("product_id",data.productId).maybeSingle();
    if(error) throw error;
    return row;
  });
export const saveRubiOfferPlaybookAdmin = createServerFn({method:"POST"})
  .middleware([requireOwnerRole])
  .validator((value:unknown) => playbookSchema.parse(value))
  .handler(async ({data}) => {
    const {supabaseAdmin} = await import("@/integrations/supabase/client.server");
    const {data:product,error:productError} = await (supabaseAdmin as any).from("hub_products")
      .select("id").eq("id",data.product_id).maybeSingle();
    if(productError) throw productError;
    if(!product) throw new Error("Produto inexistente. Escolha um item do catálogo.");
    if(data.stage === "ready_for_review" && (!data.promise || !data.proof_notes || !data.page_headline || !data.page_body || !data.channels.length)) {
      throw new Error("Revise proposta, evidências, página e canais antes de marcar para revisão.");
    }
    const {error} = await (supabaseAdmin as any).from("rubi_offer_playbooks")
      .upsert({...data,published_at:null,updated_at:new Date().toISOString()},{onConflict:"product_id"});
    if(error) throw error;
    return {success:true};
  });

/** Publishing is a distinct owner-only action: editing a playbook always unpublishes it. */
export const publishRubiOfferPlaybookAdmin = createServerFn({method:"POST"})
  .middleware([requireOwnerRole])
  .validator((value:unknown) => z.object({productId:z.string().uuid(),confirmedEvidence:z.literal(true)}).parse(value))
  .handler(async ({data}) => {
    const {supabaseAdmin} = await import("@/integrations/supabase/client.server");
    const {data:offer,error:offerError} = await (supabaseAdmin as any).from("rubi_offer_playbooks")
      .select("*").eq("product_id",data.productId).maybeSingle();
    if(offerError) throw offerError;
    if(!offer || offer.stage !== "ready_for_review" || offer.audience !== "consumer") {
      throw new Error("Apenas fichas de consumidores revisadas podem ser publicadas.");
    }
    if(rubiOfferReadiness(offer as RubiOfferPlaybook).score !== 100) {
      throw new Error("Complete todos os elementos e fontes da oferta antes de publicar.");
    }
    const {data:product,error:productError} = await (supabaseAdmin as any).from("hub_products")
      .select("id,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
      .eq("id",data.productId).maybeSingle();
    if(productError) throw productError;
    if(!product || !product.active || Number(product.retail_price) <= 0 || !approvedRubiCheckout(product)) {
      throw new Error("Produto sem checkout oficial aprovado e fornecedor ativo.");
    }
    const {error} = await (supabaseAdmin as any).from("rubi_offer_playbooks")
      .update({published_at:new Date().toISOString(),updated_at:new Date().toISOString()})
      .eq("product_id",data.productId).eq("stage","ready_for_review").eq("audience","consumer");
    if(error) throw error;
    return {success:true};
  });
export const unpublishRubiOfferPlaybookAdmin = createServerFn({method:"POST"})
  .middleware([requireOwnerRole])
  .validator((value:unknown)=>z.object({productId:z.string().uuid()}).parse(value))
  .handler(async ({data})=>{
    const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
    const {error}=await (supabaseAdmin as any).from("rubi_offer_playbooks")
      .update({published_at:null,updated_at:new Date().toISOString()}).eq("product_id",data.productId);
    if(error) throw error;
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
