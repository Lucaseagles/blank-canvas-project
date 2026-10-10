import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const videoInput = z.object({
  id: z.string().uuid().optional(), title: z.string().trim().min(1).max(200), storage_path: z.string().trim().max(2000).optional().nullable(), external_url: z.string().url().max(2000).optional().nullable(),
  duration_seconds: z.number().int().nonnegative().max(86400).optional().nullable(), category_id: z.string().uuid().optional().nullable(), status: z.enum(["published", "draft", "archived"]),
  scheduled_for: z.string().datetime().optional().nullable(), campaign_id: z.string().uuid().optional().nullable(), productIds: z.array(z.string().uuid()).max(100).optional(),
  caption: z.string().trim().max(500).optional().nullable(), subtitle_url: z.string().url().max(2000).optional().nullable(), subtitle_text: z.string().trim().max(10000).optional().nullable()
});

const videoSelect = `*, categories(name, slug), video_products(product_id, position, products(id, title, current_price, slug, images, affiliate_url, category_id, status))`;

export const getVideos = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ status: z.enum(["published", "draft", "archived"]).optional(), categoryId: z.string().uuid().optional(), campaignId: z.string().uuid().optional(), limit: z.number().int().min(1).max(100).optional().default(20), includeScheduled: z.boolean().optional().default(false) }).parse(data))
  .handler(async ({ data: { status, categoryId, campaignId, limit, includeScheduled } }) => {
    if (status && status !== "published") throw new Error("Only published videos are available publicly");
    if (includeScheduled) throw new Error("Scheduled videos are not available through the public feed");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("videos").select(videoSelect).eq("status", "published");
    if (categoryId) query = query.eq("category_id", categoryId);
    if (campaignId) query = query.eq("campaign_id", campaignId);
    query = query.or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map((video: any) => ({ ...video, video_products: (video.video_products ?? []).filter((entry: any) => ["active", "published"].includes(entry.products?.status)) }));
  });

export const getAdminVideos = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ status: z.enum(["published", "draft", "archived"]).optional(), limit: z.number().int().min(1).max(100).optional().default(50), includeScheduled: z.boolean().optional().default(true) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("videos").select(videoSelect);
    if (data.status) query = query.eq("status", data.status);
    if (!data.includeScheduled) query = query.or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`);
    const { data: rows, error } = await query.order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw error;
    return rows ?? [];
  });

export const getAdminVideoFormOptions = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [productsResult, categoriesResult, campaignsResult] = await Promise.all([
      supabaseAdmin.from("products").select("id,title,status").order("title"),
      supabaseAdmin.from("categories").select("id,name,is_active").order("name"),
      supabaseAdmin.from("campaigns").select("id,name,status,starts_at,ends_at").order("created_at", { ascending: false }),
    ]);
    const errors = [productsResult.error, categoriesResult.error, campaignsResult.error].filter(Boolean);
    if (errors.length) throw new Error(errors.map((error: any) => error.message).join(" | "));
    return { products: productsResult.data ?? [], categories: categoriesResult.data ?? [], campaigns: campaignsResult.data ?? [] };
  });

export const saveVideo = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => videoInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { productIds, ...videoData } = data;
    if (!videoData.external_url && !videoData.storage_path) throw new Error("A video URL or storage path is required");
    const payload = { title: videoData.title, status: videoData.status, storage_path: videoData.storage_path || null, external_url: videoData.external_url || null, video_url: videoData.external_url || (videoData.storage_path ? `storage://${videoData.storage_path}` : ""), duration_seconds: videoData.duration_seconds ?? null, category_id: videoData.category_id || null, scheduled_for: videoData.scheduled_for || null, campaign_id: videoData.campaign_id || null, caption: videoData.caption || null, subtitle_url: videoData.subtitle_url || null, subtitle_text: videoData.subtitle_text || null };
    let videoId = videoData.id;
    if (videoId) { const { error } = await supabaseAdmin.from("videos").update(payload).eq("id", videoId); if (error) throw error; }
    else { const { data: newVideo, error } = await supabaseAdmin.from("videos").insert(payload).select("id").single(); if (error) throw error; videoId = newVideo.id; }
    if (productIds) { const { error: de } = await supabaseAdmin.from("video_products").delete().eq("video_id", videoId); if (de) throw de; if (productIds.length) { const { error: ie } = await supabaseAdmin.from("video_products").insert(productIds.map((productId, position) => ({ video_id: videoId, product_id: productId, position }))); if (ie) throw ie; } }
    return { success: true, id: videoId };
  });

export const setVideoStatus = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["published", "draft", "archived"]) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: readError } = await supabaseAdmin.from("videos").select("id,scheduled_for").eq("id", data.id).maybeSingle();
    if (readError) throw readError;
    if (!existing) throw new Error("Vídeo não encontrado.");
    if (data.status === "published" && existing.scheduled_for && new Date(existing.scheduled_for).getTime() > Date.now()) {
      throw new Error("Este vídeo está agendado para o futuro e não pode ser publicado agora.");
    }
    const { error } = await supabaseAdmin.from("videos").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { success: true, id: data.id, status: data.status };
  });

export const deleteVideo = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id } }) => { const { supabaseAdmin } = await import("@/integrations/supabase/client.server"); const { error } = await supabaseAdmin.from("videos").delete().eq("id", id); if (error) throw error; return { success: true }; });
