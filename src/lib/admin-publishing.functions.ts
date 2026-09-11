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
  const table = contentType === "offer" ? "offers" : contentType === "video" ? "videos" : "bundles";
  const { data, error } = await client.from(table).select("id").eq("id", contentId).maybeSingle();
  if (error) throw new Error(`Não foi possível validar o conteúdo: ${error.message}`);
  if (!data) throw new Error(`O conteúdo selecionado não existe em ${table}.`);
}

export const getScheduledPosts = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const client = await db();
    const { data, error } = await client
      .from("scheduled_posts")
      .select("*")
      .order("scheduled_for", { ascending: true })
      .limit(200);
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

    const { data: created, error } = await client
      .from("scheduled_posts")
      .insert({
        ...data,
        scheduled_for: scheduledFor.toISOString(),
        status: "pending",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(`Não foi possível agendar: ${error.message}`);
    return created as ScheduledPost;
  });

export const cancelScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data }) => {
    const client = await db();
    const { data: post, error: readError } = await client
      .from("scheduled_posts")
      .select("status")
      .eq("id", data.id)
      .single();
    if (readError) throw new Error(`Publicação não encontrada: ${readError.message}`);
    if (post.status !== "pending") throw new Error("Somente publicações pendentes podem ser canceladas.");

    const { error } = await client
      .from("scheduled_posts")
      .update({ status: "failed", error_message: "Cancelada pelo Owner" })
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) throw new Error(`Não foi possível cancelar: ${error.message}`);
    return { success: true };
  });

export const retryScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data }) => {
    const client = await db();
    const { data: post, error: readError } = await client
      .from("scheduled_posts")
      .select("id,status,content_type,content_id")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error(`Não foi possível localizar a publicação: ${readError.message}`);
    if (!post) throw new Error("Publicação não encontrada.");
    if (post.status !== "failed") throw new Error("Somente publicações com falha podem ser reprocessadas.");

    await assertContentExists(client, post.content_type, post.content_id);

    const { error } = await client
      .from("scheduled_posts")
      .update({ status: "pending", scheduled_for: new Date().toISOString(), error_message: null })
      .eq("id", data.id)
      .eq("status", "failed");
    if (error) throw new Error(`Não foi possível reprocessar: ${error.message}`);
    return { success: true };
  });

export const processScheduledPosts = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => z.object({ limit: z.number().int().min(1).max(50).optional() }).parse(value ?? {}))
  .handler(async ({ data }) => runScheduledPublishing(data.limit ?? 10));
