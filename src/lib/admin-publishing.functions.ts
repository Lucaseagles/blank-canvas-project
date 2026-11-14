import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { runScheduledPublishing, type ScheduledPost } from "./scheduled-publishing.server";

const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;

const postSchema = z.object({
  content_type: z.enum(["offer", "video", "bundle"]),
  content_id: z.string().uuid(),
  channels: z.array(z.enum(["telegram"])).min(1),
  scheduled_for: z.string().datetime({ offset: true }),
  message_template: z.string().trim().min(1).max(4000),
});

export { type ScheduledPost };

async function assertContentExists(client: any, contentType: "offer" | "video" | "bundle", contentId: string) {
  const table = contentType === "offer" ? "offer_groups" : contentType === "video" ? "videos" : "products";
  const { data, error } = await client.from(table).select("id").eq("id", contentId).maybeSingle();
  if (error) throw new Error(`Não foi possível validar o conteúdo: ${error.message}`);
  if (!data) throw new Error(`O conteúdo selecionado não existe em ${table}.`);
}

export const getScheduledPosts = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const client = await db();
    const { data, error } = await client.from("scheduled_posts").select("*").order("scheduled_for", { ascending: true }).limit(200);
    if (error) throw new Error(`Não foi possível carregar as publicações: ${error.message}`);
    return (data ?? []) as ScheduledPost[];
  });

export const createScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => postSchema.parse(value))
  .handler(async ({ data, context }) => {
    const scheduledFor = new Date(data.scheduled_for);
    if (scheduledFor.getTime() <= Date.now()) throw new Error("A data de publicação precisa estar no futuro.");
    const client = await db();
    await assertContentExists(client, data.content_type, data.content_id);
    const { data: created, error } = await client.rpc("rubi_create_scheduled_post_audited", {
      p_content_type: data.content_type,
      p_content_id: data.content_id,
      p_channels: data.channels,
      p_scheduled_for: scheduledFor.toISOString(),
      p_message_template: data.message_template,
      p_actor: context.userId,
    });
    if (error) throw new Error(`Não foi possível agendar: ${error.message}`);
    return created as ScheduledPost;
  });

export const cancelScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data, context }) => {
    const client = await db();
    const { error } = await client.rpc("rubi_decide_scheduled_post_audited", {
      p_post_id: data.id, p_action: "cancel", p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const retryScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data, context }) => {
    const client = await db();
    const { data: post, error: readError } = await client.from("scheduled_posts")
      .select("id,status,content_type,content_id").eq("id", data.id).maybeSingle();
    if (readError) throw new Error(`Não foi possível localizar a publicação: ${readError.message}`);
    if (!post) throw new Error("Publicação não encontrada.");
    if (post.status !== "failed") throw new Error("Somente publicações com falha podem ser reprocessadas.");
    await assertContentExists(client, post.content_type, post.content_id);
    const { error } = await client.rpc("rubi_decide_scheduled_post_audited", {
      p_post_id: data.id, p_action: "retry", p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const processScheduledPosts = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => z.object({ limit: z.number().int().min(1).max(50).optional() }).parse(value ?? {}))
  .handler(async ({ data }) => runScheduledPublishing(data.limit ?? 10));


export const prepareStrategyPublishing = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => z.object({ orchestration_id: z.string().uuid(), scheduled_for: z.string().datetime({ offset: true }).optional() }).parse(value))
  .handler(async ({ data, context }) => {
    const client = await db();
    const { data: orchestration, error: orchestrationError } = await client
      .from("strategy_orchestrations")
      .select("id,status")
      .eq("id", data.orchestration_id)
      .maybeSingle();
    if (orchestrationError) throw new Error(`Não foi possível validar a orquestração: ${orchestrationError.message}`);
    if (!orchestration) throw new Error("Orquestração não encontrada.");
    if (orchestration.status !== "approved") throw new Error("A orquestração precisa estar aprovada antes de preparar a fila de publicação.");

    const { data: videos, error: videosError } = await client
      .from("strategy_orchestration_videos")
      .select("video_id, videos(id,title,campaign_id,scheduled_for,status)")
      .eq("orchestration_id", data.orchestration_id);
    if (videosError) throw new Error(`Não foi possível carregar os vídeos da orquestração: ${videosError.message}`);

    const results: Array<{ video_id: string; status: "queued" | "already_queued" | "skipped" | "unsupported"; reason?: string }> = [];
    const fallbackSchedule = data.scheduled_for ? new Date(data.scheduled_for).toISOString() : new Date(Date.now() + 5 * 60 * 1000).toISOString();

    for (const row of videos ?? []) {
      const video = Array.isArray(row.videos) ? row.videos[0] : row.videos;
      if (!video) { results.push({ video_id: row.video_id, status: "skipped", reason: "Vídeo não encontrado." }); continue; }
      if (!video.campaign_id) { results.push({ video_id: video.id, status: "skipped", reason: "Vídeo sem campanha vinculada." }); continue; }

      const { data: channels, error: channelsError } = await client
        .from("campaign_channels")
        .select("channel")
        .eq("campaign_id", video.campaign_id)
        .eq("is_enabled", true);
      if (channelsError) throw new Error(`Não foi possível carregar os canais da campanha: ${channelsError.message}`);

      const requestedChannels = Array.from(new Set((channels ?? []).map((entry: { channel: string }) => entry.channel).filter(Boolean)));
      const supportedChannels = requestedChannels.filter((channel) => channel === "telegram");
      const unsupportedChannels = requestedChannels.filter((channel) => channel !== "telegram");

      if (!supportedChannels.length) {
        results.push({ video_id: video.id, status: unsupportedChannels.length ? "unsupported" : "skipped", reason: unsupportedChannels.length ? `Canais sem adapter: ${unsupportedChannels.join(", ")}.` : "A campanha não possui canal habilitado." });
        continue;
      }

      const scheduledFor = video.scheduled_for && new Date(video.scheduled_for).getTime() > Date.now()
        ? new Date(video.scheduled_for).toISOString()
        : fallbackSchedule;
      const { data: outcome, error: queueError } = await client.rpc("rubi_queue_orchestration_video_audited", {
        p_orchestration_id: data.orchestration_id,
        p_video_id: video.id,
        p_scheduled_for: scheduledFor,
        p_actor: context.userId,
      });
      if (queueError) throw new Error(`Não foi possível preparar a publicação: ${queueError.message}`);
      if (outcome !== "queued" && outcome !== "already_queued") throw new Error("Resultado inesperado ao preparar publicação.");
      results.push({
        video_id: video.id,
        status: outcome,
        ...(outcome === "queued" && unsupportedChannels.length
          ? { reason: `Telegram preparado; sem adapter para: ${unsupportedChannels.join(", ")}.` }
          : {}),
      });
    }

    return {
      orchestration_id: data.orchestration_id,
      queued: results.filter((item) => item.status === "queued").length,
      already_queued: results.filter((item) => item.status === "already_queued").length,
      skipped: results.filter((item) => item.status === "skipped").length,
      unsupported: results.filter((item) => item.status === "unsupported").length,
      results,
    };
  });
