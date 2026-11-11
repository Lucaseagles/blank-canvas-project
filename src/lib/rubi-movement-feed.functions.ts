import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyOptionalUser } from "./personalization.server";
import { rankRubiOffersByInterests, type RubiInterestCategory } from "./rubi-unified-interest-ranking";
import { approvedRubiCheckout } from "./rubi-checkout-validation";
import { canServeApprovedMovementPage } from "./rubi-movement-publication";
import { RUBI_ORGANIC_CHANNELS, rubiOrganicProductPath, type RubiOrganicChannel } from "./rubi-organic-campaigns";

export type RubiFeedMovement = {
 productId: string;
 title: string;
 category: string | null;
 imageUrl: string | null;
 price: number;
 headline: string;
 promise: string;
 href: string;
};

const allowedChannels = new Set<string>(RUBI_ORGANIC_CHANNELS.map(item => item.id));

/** Approved campaigns ranked using only the authenticated person's category interests.
 * Anonymous visitors see the editorial fallback. Never expose private interest records.
 */
export const getRubiApprovedMovementFeed = createServerFn({ method: "POST" })
 .validator((input: unknown) => z.object({
  userId:z.string().uuid().nullable(),
  accessToken:z.string().min(20).max(8192).nullable().optional()
 }).parse(input))
 .handler(async ({ data }): Promise<RubiFeedMovement[]> => {
 await verifyOptionalUser(data.userId,data.accessToken);
 const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
 const db = supabaseAdmin as any;
 const { data: plans, error: plansError } = await db.from("rubi_movement_distribution")
  .select("variant_id,channel,campaign,published_variant_revision,published_movement_revision,page_published_at")
  .not("page_published_at", "is", null)
  .order("page_published_at", { ascending: false }).limit(60);
 if (plansError) throw plansError;
 if (!plans?.length) return [];
 const variantIds = [...new Set(plans.map((p: any) => p.variant_id as string))];
 const { data: variants, error: variantsError } = await db.from("rubi_movement_variants")
  .select("id,movement_id,revision,status,page_headline")
  .in("id", variantIds);
 if (variantsError) throw variantsError;
 if (!variants?.length) return [];
 const byVariant = new Map<string,any>(variants.map((v: any) => [v.id,v]));
 const movementIds = [...new Set(variants.map((v: any) => v.movement_id as string))];
 const { data: movements, error: movementsError } = await db.from("rubi_movements")
  .select("id,product_id,revision,status,audience,truthful_promise")
  .in("id", movementIds);
 if (movementsError) throw movementsError;
 if (!movements?.length) return [];
 const byMovement = new Map<string,any>(movements.map((m: any) => [m.id,m]));
 const productIds = [...new Set(movements.map((m: any) => m.product_id as string))];
 const { data: products, error: productsError } = await db.from("hub_products")
  .select("id,title,category,image_url,retail_price,active,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
  .in("id",productIds).eq("active",true).eq("hub_suppliers.active",true);
 if (productsError) throw productsError;
 const byProduct = new Map<string,any>((products ?? []).map((p: any) => [p.id,p]));
 const seen = new Set<string>();
 const result: RubiFeedMovement[] = [];
 for (const plan of plans) {
  const variant = byVariant.get(plan.variant_id);
  const movement = variant && byMovement.get(variant.movement_id);
  const product = movement && byProduct.get(movement.product_id);
  if (!variant || !movement || !product || seen.has(product.id)) continue;
  if (!allowedChannels.has(plan.channel) || !Number.isFinite(Number(product.retail_price)) ||
      Number(product.retail_price) <= 0 || !approvedRubiCheckout(product)) continue;
  if (!canServeApprovedMovementPage({
   variantStatus:variant.status,movementStatus:movement.status,movementAudience:movement.audience,
   variantRevision:variant.revision,movementRevision:movement.revision,
   approvedVariantRevision:plan.published_variant_revision,
   approvedMovementRevision:plan.published_movement_revision,
   productMatches:movement.product_id===product.id,checkoutReady:true,
  })) continue;
  // Existing campaign path is the exact link understood by the approved movement landing.
  let href: string;
  try { href = rubiOrganicProductPath(product.id,plan.channel as RubiOrganicChannel,plan.campaign); }
  catch { continue; }
  seen.add(product.id);
  result.push({
   productId:product.id,title:product.title,category:product.category ?? null,
   imageUrl:product.image_url ?? null,price:Number(product.retail_price),
   headline:variant.page_headline,promise:movement.truthful_promise,href
  });
 }
 if (!data.userId || !result.length) return result.slice(0,6);
 // Only explicit category preferences are used for movement targeting at this stage.
 // Behavioral interest scoring requires a separately validated opt-in control.
 const { data: preference, error: preferenceError } = await db.from("user_preferences")
  .select("preferred_categories").eq("user_id",data.userId).maybeSingle();
 if (preferenceError || !Array.isArray(preference?.preferred_categories) ||
     !preference.preferred_categories.length) return result.slice(0,6);
 const { data: categories, error: categoriesError } = await db.from("categories")
  .select("id,name,slug").in("id",preference.preferred_categories.slice(0,20));
 if (categoriesError || !categories?.length) return result.slice(0,6);
 const interests:RubiInterestCategory[] = categories.map((category:any)=>({
  name:category.name,slug:category.slug,score:1
 }));
 return rankRubiOffersByInterests(result,interests,6);
});
