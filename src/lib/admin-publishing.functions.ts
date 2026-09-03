import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { getIntegrationSecretServer } from "@/integrations/secrets.server";

export type ScheduledPost = {
  id: string;
  content_type: string;
  content_id: string;
  channels: string[];
  message_template: string | null;
  scheduled_for: string;
  status: "pending" | "processing" | "published" | "failed";
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  created_by: string | null;
};

const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;

const postSchema = z.object({
  content_type: z.string().trim().min(1).max(50),
  content_id: z.string().uuid(),
  channels: z.array(z.enum(["telegram"])).min(1),
  scheduled_for: z.string().datetime({ offset: true }),
  message_template: z.string().trim().min(1).max(4000),
});

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
    const { data: created, error } = await client.from("scheduled_posts").insert({
      ...data,
      scheduled_for: scheduledFor.toISOString(),
      status: "pending",
      created_by: context.userId,
    }).select("*").single();
    if (error) throw new Error(`Não foi possível agendar: ${error.message}`);
    return created as ScheduledPost;
  });

export const cancelScheduledPost = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data }) => {
    const client = await db();
    const { data: post, error: readError } = await client.from("scheduled_posts").select("status").eq("id", data.id).single();
    if (readError) throw new Error(`Publicação não encontrada: ${readError.message}`);
    if (post.status !== "pending") throw new Error("Somente publicações pendentes podem ser canceladas.");
    const { error } = await client.from("scheduled_posts").update({ status: "failed", error_message: "Cancelada pelo Owner" }).eq("id", data.id).eq("status", "pending");
    if (error) throw new Error(`Não foi possível cancelar: ${error.message}`);
    return { success: true };
  });

async function sendTelegram(message: string) {
  const token = await getIntegrationSecretServer("telegram", "bot_token");
  const chatId = await getIntegrationSecretServer("telegram", "channel_id");
  if (!token || !chatId) throw new Error("Telegram não está configurado no Secure Hub.");

  const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML", disable_web_page_preview: false }),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json() as { ok?: boolean; description?: string };
  if (!response.ok || !result.ok) throw new Error(result.description ?? `Telegram respondeu HTTP ${response.status}.`);
}

export const processScheduledPosts = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((value: unknown) => z.object({ limit: z.number().int().min(1).max(50).optional() }).parse(value ?? {}))
  .handler(async ({ data }) => {
    const client = await db();
    const limit = data.limit ?? 10;
    const now = new Date().toISOString();
    const { data: duePosts, error } = await client.from("scheduled_posts").select("*").eq("status", "pending").lte("scheduled_for", now).order("scheduled_for", { ascending: true }).limit(limit);
    if (error) throw new Error(`Não foi possível localizar publicações vencidas: ${error.message}`);

    const results: Array<{ id: string; status: "published" | "failed"; error?: string }> = [];
    for (const post of (duePosts ?? []) as ScheduledPost[]) {
      const { data: claimed, error: claimError } = await client.from("scheduled_posts").update({ status: "processing", error_message: null }).eq("id", post.id).eq("status", "pending").select("id").maybeSingle();
      if (claimError || !claimed) continue;

      try {
        const channels = Array.isArray(post.channels) ? post.channels : [];
        if (!channels.length) throw new Error("Nenhum canal configurado.");
        const unsupported = channels.filter((channel) => channel !== "telegram");
        if (unsupported.length) throw new Error(`Canal não suportado pelo publicador: ${unsupported.join(", ")}.`);
        if (!post.message_template?.trim()) throw new Error("Mensagem da publicação está vazia.");

        for (const channel of channels) {
          if (channel === "telegram") await sendTelegram(post.message_template.trim());
        }

        const publishedAt = new Date().toISOString();
        await client.from("scheduled_posts").update({ status: "published", published_at: publishedAt, error_message: null }).eq("id", post.id).eq("status", "processing");
        results.push({ id: post.id, status: "published" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido ao publicar.";
        await client.from("scheduled_posts").update({ status: "failed", error_message: message }).eq("id", post.id).eq("status", "processing");
        results.push({ id: post.id, status: "failed", error: message });
      }
    }

    return { processed: results.length, results };
  });
