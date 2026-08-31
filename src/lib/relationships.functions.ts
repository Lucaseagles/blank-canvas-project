import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
  const { data: { user } } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabaseAdmin.rpc('get_eligible_strategic_popup', { p_user_id: user.id });
  if (error) throw error;
  return data?.[0] ?? null;
});

export const saveBundle = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    id: z.string().uuid().optional(), title: z.string().min(1), slug: z.string().min(1),
    description: z.string().optional(), image_url: z.string().optional(), is_active: z.boolean().default(true),
    bundle_discount_price: z.number().finite().positive().optional(),
    products: z.array(z.object({ id: z.string().uuid(), position: z.number().default(0) })).optional()
  }).parse(data))
  .handler(async ({ data }) => data.id ? updateBundle(data.id, data) : createBundle(data));

export const removeBundle = createServerFn({ method: "POST" })
  .inputValidator((data) => z.string().uuid().parse(data))
  .handler(async ({ data: id }) => deleteBundle(id));

export const addRelationship = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ productId: z.string().uuid(), relatedProductId: z.string().uuid(), type: z.enum(['CROSS_SELL', 'UPSELL', 'DOWNSELL']) }).parse(data))
  .handler(async ({ data }) => createProductRelationship(data.productId, data.relatedProductId, data.type));

export const removeRelationship = createServerFn({ method: "POST" })
  .inputValidator((data) => z.string().uuid().parse(data))
  .handler(async ({ data: id }) => deleteProductRelationship(id));
