import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { RUBI_OFFER_CHANNELS } from "./rubi-offer-playbook";

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
      .select("product_id,audience,promise,verified_benefits,proof_notes,creative_hook,creative_script,page_headline,page_body,objections,movement_plan,channels,stage")
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
      .upsert({...data,updated_at:new Date().toISOString()},{onConflict:"product_id"});
    if(error) throw error;
    return {success:true};
  });
