import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { getProductRelationships, getBundleBySlug, getBundles } from "./relationships.server";

export const getRelatedProducts = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ productId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => getProductRelationships(data.productId));

export const getBundleDetails = createServerFn({ method: "GET" })
  .inputValidator((data) => z.string().trim().min(1).max(200).parse(data))
  .handler(async ({ data: slug }) => getBundleBySlug(slug));

export const listBundles = createServerFn({ method: "GET" }).handler(async () => getBundles());

export const getStrategicPopup = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: strategic, error: strategicError } = await supabaseAdmin.rpc('get_eligible_strategic_popup', { p_user_id: user.id });
  if (strategicError) throw strategicError;
  if (strategic?.[0]) return strategic[0];
  const { data: benefit, error: benefitError } = await (supabaseAdmin as any).rpc('get_eligible_benefit_popup', { p_user_id: user.id });
  if (benefitError) throw benefitError;
  return benefit?.[0] ?? null;
});

const BundleInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(1).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  image_url: z.string().url().max(2000).optional().or(z.literal('')).nullable(),
  is_active: z.boolean().default(true),
  bundle_discount_price: z.number().finite().nonnegative().optional().nullable(),
  products: z.array(z.object({ id: z.string().uuid(), position: z.number().int().nonnegative() })).max(100).optional()
});

async function manageBundle(action: string, id: string | null, payload: Record<string, unknown>, actor: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).rpc("rubi_manage_bundle_audited", {
    p_action: action, p_id: id, p_payload: payload, p_actor: actor,
  });
  if (error) throw new Error(`Não foi possível concluir a operação do bundle: ${error.message}`);
  return data;
}

export const saveBundle = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => BundleInput.parse(data))
  .handler(async ({ data, context }) => {
    const payload: Record<string, unknown> = {
      title: data.title, slug: data.slug, is_active: data.is_active,
    };
    if (data.description !== undefined) payload['description'] = data.description;
    if (data.image_url !== undefined) payload['image_url'] = data.image_url || null;
    if (data.bundle_discount_price !== undefined) payload['bundle_discount_price'] = data.bundle_discount_price;
    if (data.products !== undefined) payload['products'] = data.products;
    return manageBundle("save", data.id ?? null, payload, context.userId);
  });

export const removeBundle = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => z.string().uuid().parse(data))
  .handler(async ({ data: id, context }) => manageBundle("delete", id, {}, context.userId));

export const addRelationship = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => z.object({
    productId: z.string().uuid(), relatedProductId: z.string().uuid(),
    type: z.enum(['CROSS_SELL', 'UPSELL', 'DOWNSELL']),
  }).parse(data))
  .handler(async ({ data, context }) => manageBundle("relationship_create", null, {
    product_id: data.productId, related_product_id: data.relatedProductId, type: data.type,
  }, context.userId));

export const removeRelationship = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => z.string().uuid().parse(data))
  .handler(async ({ data: id, context }) => manageBundle("relationship_delete", id, {}, context.userId));
