import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { runScheduledPublishing, type ScheduledPost } from "./scheduled-publishing.server";

const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;

const postSchema = z.object({
  content_type: z.string().trim().min(1).max(50),
  content_id: z.string().uuid(),
  channels: z.array(z.enum(["telegram"])).min(1),
  scheduled_for: z.string().datetime({ offset: true }),
  message_template: z.string().trim().min(1).max(4000),
});

export { type ScheduledPost };

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

export const processScheduledPosts = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => z.object({ limit: z.number().int().min(1).max(50).optional() }).parse(value ?? {}))
  .handler(async ({ data }) => runScheduledPublishing(data.limit ?? 10));
