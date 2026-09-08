import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { getProductRelationships, getBundleBySlug, getBundles, createBundle, updateBundle, deleteBundle, createProductRelationship, deleteProductRelationship } from "./relationships.server";

export const getRelatedProducts = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ productId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => getProductRelationships(data.productId));

export const getBundleDetails = createServerFn({ method: "GET" })
  .inputValidator((data) => z.string().parse(data))
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
  slug: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  bundle_discount_price: z.number().finite().positive().optional(),
  products: z.array(z.object({ id: z.string().uuid(), position: z.number().int().min(0) })).optional()
});

export const saveBundle = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => BundleInput.parse(data))
  .handler(async ({ data }) => data.id ? updateBundle(data.id, data) : createBundle(data));

export const removeBundle = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => z.string().uuid().parse(data))
  .handler(async ({ data: id }) => deleteBundle(id));

export const addRelationship = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => z.object({ productId: z.string().uuid(), relatedProductId: z.string().uuid(), type: z.enum(['CROSS_SELL', 'UPSELL', 'DOWNSELL']) }).parse(data))
  .handler(async ({ data }) => createProductRelationship(data.productId, data.relatedProductId, data.type));

export const removeRelationship = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => z.string().uuid().parse(data))
  .handler(async ({ data: id }) => deleteProductRelationship(id));
