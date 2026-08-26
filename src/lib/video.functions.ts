import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const getVideos = createServerFn({ method: "GET" })
  .validator((data: { status?: 'published' | 'draft' | 'archived', categoryId?: string, campaignId?: string, limit?: number, includeScheduled?: boolean }) => z.object({
    status: z.enum(['published', 'draft', 'archived']).optional(), categoryId: z.string().optional(), campaignId: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional().default(20), includeScheduled: z.boolean().optional().default(false)
  }).parse(data))
  .handler(async ({ data: { status, categoryId, campaignId, limit, includeScheduled } }) => {
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      let query = supabaseAdmin.from("videos").select(`*, categories(name, slug), video_products(product_id, products(id, title, current_price, slug, images, affiliate_url, category_id))`);
      query = query.eq("status", status || "published");
      if (categoryId) query = query.eq("category_id", categoryId);
      if (campaignId) query = query.eq("campaign_id" as any, campaignId);
      if (!includeScheduled) query = query.or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}` as any);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching videos:", error);
      return [];
    }
  });

export const saveVideo = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({
    id: z.string().uuid().optional(), title: z.string().trim().min(1).max(200), storage_path: z.string().optional(), external_url: z.string().url().optional(),
    duration_seconds: z.number().nonnegative().optional(), category_id: z.string().uuid().optional(), status: z.enum(['published', 'draft', 'archived']),
    scheduled_for: z.string().datetime().optional().nullable(), campaign_id: z.string().uuid().optional().nullable(), productIds: z.array(z.string().uuid()).max(100).optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { productIds, ...videoData } = data;
    const payload: any = {
      title: videoData.title, status: videoData.status, storage_path: videoData.storage_path || null,
      external_url: videoData.external_url || null, duration_seconds: videoData.duration_seconds || null,
      category_id: videoData.category_id || null, scheduled_for: videoData.scheduled_for || null,
      campaign_id: videoData.campaign_id || null, video_url: videoData.external_url || (videoData.storage_path ? `storage://${videoData.storage_path}` : '')
    };
    let videoId = videoData.id;
    if (videoId) {
      const { error } = await supabaseAdmin.from("videos").update(payload).eq("id", videoId);
      if (error) throw error;
    } else {
      const { data: newVideo, error } = await supabaseAdmin.from("videos").insert(payload).select().single();
      if (error) throw error;
      videoId = newVideo.id;
    }
    if (productIds) {
      await supabaseAdmin.from("video_products").delete().eq("video_id", videoId);
      if (productIds.length) await supabaseAdmin.from("video_products").insert(productIds.map((productId, position) => ({ video_id: videoId, product_id: productId, position })));
    }
    return { success: true, id: videoId };
  });

export const deleteVideo = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id } }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from("videos").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  });