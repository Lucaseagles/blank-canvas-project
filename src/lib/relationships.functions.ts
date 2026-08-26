import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getProductRelationships, getBundleBySlug, getBundles, createBundle, updateBundle, deleteBundle, createProductRelationship, deleteProductRelationship } from "./relationships.server";

export const getRelatedProducts = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ productId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    return getProductRelationships(data.productId);
  });

export const getBundleDetails = createServerFn({ method: "GET" })
  .inputValidator((data) => z.string().parse(data))
  .handler(async ({ data: slug }) => {
    return getBundleBySlug(slug);
  });

export const listBundles = createServerFn({ method: "GET" })
  .handler(async () => {
    return getBundles();
  });

// Admin functions
export const saveBundle = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    image_url: z.string().optional(),
    is_active: z.boolean().default(true),
    products: z.array(z.object({
      id: z.string().uuid(),
      position: z.number().default(0)
    })).optional()
  }).parse(data))
  .handler(async ({ data }) => {
    if (data.id) {
      return updateBundle(data.id, data);
    }
    return createBundle(data);
  });

export const removeBundle = createServerFn({ method: "POST" })
  .inputValidator((data) => z.string().uuid().parse(data))
  .handler(async ({ data: id }) => {
    return deleteBundle(id);
  });

export const addRelationship = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    productId: z.string().uuid(),
    relatedProductId: z.string().uuid(),
    type: z.enum(['CROSS_SELL', 'UPSELL', 'DOWNSELL'])
  }).parse(data))
  .handler(async ({ data }) => {
    return createProductRelationship(data.productId, data.relatedProductId, data.type);
  });

export const removeRelationship = createServerFn({ method: "POST" })
  .inputValidator((data) => z.string().uuid().parse(data))
  .handler(async ({ data: id }) => {
    return deleteProductRelationship(id);
  });
