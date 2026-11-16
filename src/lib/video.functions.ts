import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const videoInput = z.object({
  id: z.string().uuid().optional(), title: z.string().trim().min(1).max(200), storage_path: z.string().trim().max(2000).optional().nullable(), external_url: z.string().url().max(2000).optional().nullable(),
  duration_seconds: z.number().int().nonnegative().max(86400).optional().nullable(), category_id: z.string().uuid().optional().nullable(), status: z.enum(["published", "draft", "archived"]),
  scheduled_for: z.string().datetime().optional().nullable(), campaign_id: z.string().uuid().optional().nullable(), productIds: z.array(z.string().uuid()).max(100).optional(),
  caption: z.string().trim().max(500).optional().nullable(), subtitle_url: z.string().url().max(2000).optional().nullable(), subtitle_text: z.string().trim().max(10000).optional().nullable()
});

const VIDEO_BUCKET = "videos";
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const VIDEO_SIGNED_URL_SECONDS = 60 * 60 * 6;
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;

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
    return Promise.all((data ?? []).map(async (video: any) => {
      const playbackUrl = video.storage_path
        ? await supabaseAdmin.storage.from(VIDEO_BUCKET).createSignedUrl(video.storage_path, VIDEO_SIGNED_URL_SECONDS)
        : null;
      if (playbackUrl?.error || (video.storage_path && !playbackUrl?.data?.signedUrl)) {
        throw new Error("Não foi possível gerar acesso temporário ao vídeo publicado.");
      }
      return {
        ...video,
        storage_path: undefined,
        playback_url: playbackUrl?.data?.signedUrl ?? video.external_url ?? video.video_url,
        video_products: (video.video_products ?? []).filter((entry: any) => ["active", "published"].includes(entry.products?.status)),
      };
    }));
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

export const createVideoUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    fileName: z.string().trim().min(1).max(255),
    contentType: z.enum(VIDEO_MIME_TYPES),
    size: z.number().int().positive().max(VIDEO_MAX_BYTES),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const extension = data.contentType === "video/mp4" ? "mp4" : "webm";
    const suppliedExtension = data.fileName.split(".").pop()?.toLowerCase();
    if (suppliedExtension !== extension) throw new Error("A extensão do arquivo não corresponde ao formato do vídeo.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const storage = supabaseAdmin.storage;
    const existing = await storage.getBucket(VIDEO_BUCKET);
    if (existing.error) {
      const missing = existing.error.statusCode === "404" || /not found|does not exist/i.test(existing.error.message);
      if (!missing) throw new Error(existing.error.message);
      const { error: createError } = await storage.createBucket(VIDEO_BUCKET, {
        public: false,
        fileSizeLimit: VIDEO_MAX_BYTES,
        allowedMimeTypes: [...VIDEO_MIME_TYPES],
      });
      if (createError) throw new Error(createError.message);
    } else if (
      existing.data.public ||
      existing.data.file_size_limit !== VIDEO_MAX_BYTES ||
      JSON.stringify([...(existing.data.allowed_mime_types ?? [])].sort()) !== JSON.stringify([...VIDEO_MIME_TYPES].sort())
    ) {
      const { error: updateError } = await storage.updateBucket(VIDEO_BUCKET, {
        public: false,
        fileSizeLimit: VIDEO_MAX_BYTES,
        allowedMimeTypes: [...VIDEO_MIME_TYPES],
      });
      if (updateError) throw new Error(updateError.message);
    }
    const path = `owner/${context.userId}/${crypto.randomUUID()}.${extension}`;
    const { data: signed, error } = await storage.from(VIDEO_BUCKET).createSignedUploadUrl(path);
    if (error || !signed?.token) throw new Error(error?.message ?? "Não foi possível emitir o upload temporário.");
    return { path, token: String(signed.token), expiresInSeconds: 7200, maxBytes: VIDEO_MAX_BYTES };
  });

export const discardVideoUpload = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({ path: z.string().trim().min(1).max(2000) }).parse(input))
  .handler(async ({ data, context }) => {
    if (!data.path.startsWith(`owner/${context.userId}/`)) throw new Error("O arquivo não pertence ao upload autorizado deste Owner.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from(VIDEO_BUCKET).remove([data.path]);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const saveVideo = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => videoInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { productIds, ...videoData } = data;
    if (!videoData.external_url && !videoData.storage_path) throw new Error("A video URL or storage path is required");
    if (videoData.external_url && videoData.storage_path) throw new Error("Use um vídeo enviado ou uma URL externa, não os dois.");
    if (videoData.storage_path && !videoData.storage_path.startsWith(`owner/${context.userId}/`)) {
      throw new Error("O arquivo de vídeo não pertence ao upload autorizado deste Owner.");
    }
    let previousStoragePath: string | null = null;
    if (videoData.id) {
      const { data: previous, error: previousError } = await supabaseAdmin.from("videos").select("storage_path").eq("id", videoData.id).maybeSingle();
      if (previousError) throw new Error(previousError.message);
      previousStoragePath = previous?.storage_path ?? null;
    }
    const payload = {
      title: videoData.title,
      status: videoData.status,
      storage_path: videoData.storage_path || null,
      external_url: videoData.external_url || null,
      duration_seconds: videoData.duration_seconds ?? null,
      category_id: videoData.category_id || null,
      scheduled_for: videoData.scheduled_for || null,
      campaign_id: videoData.campaign_id || null,
      caption: videoData.caption || null,
      subtitle_url: videoData.subtitle_url || null,
      subtitle_text: videoData.subtitle_text || null,
    };
    const { data: result, error } = await supabaseAdmin.rpc("rubi_manage_video_audited", {
      p_action: "save",
      p_id: videoData.id ?? null,
      p_payload: payload,
      p_product_ids: productIds ?? null,
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    const saved = result as unknown as { id?: string } | null;
    if (!saved?.id) throw new Error("Vídeo, associações e auditoria não foram registrados.");
    let storageCleanupPending = false;
    if (previousStoragePath && previousStoragePath !== (videoData.storage_path ?? null)) {
      const { error: cleanupError } = await supabaseAdmin.storage.from(VIDEO_BUCKET).remove([previousStoragePath]);
      storageCleanupPending = Boolean(cleanupError);
    }
    return { success: true, id: saved.id, storageCleanupPending };
  });

export const setVideoStatus = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["published", "draft", "archived"]) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("rubi_manage_video_audited", {
      p_action: "status",
      p_id: data.id,
      p_payload: { status: data.status },
      p_product_ids: null,
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    const saved = result as unknown as { id?: string; status?: string } | null;
    if (saved?.id !== data.id || saved?.status !== data.status) throw new Error("Status e auditoria não foram registrados.");
    return { success: true, id: data.id, status: data.status };
  });

export const deleteVideo = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id }, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: previous, error: previousError } = await supabaseAdmin.from("videos").select("storage_path").eq("id", id).maybeSingle();
    if (previousError) throw new Error(previousError.message);
    const { data: result, error } = await supabaseAdmin.rpc("rubi_manage_video_audited", {
      p_action: "delete",
      p_id: id,
      p_payload: null,
      p_product_ids: null,
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    const deleted = result as unknown as { id?: string } | null;
    if (deleted?.id !== id) throw new Error("Exclusão e auditoria não foram registradas.");
    let storageCleanupPending = false;
    if (previous?.storage_path) {
      const { error: cleanupError } = await supabaseAdmin.storage.from(VIDEO_BUCKET).remove([previous.storage_path]);
      storageCleanupPending = Boolean(cleanupError);
    }
    return { success: true, storageCleanupPending };
  });
