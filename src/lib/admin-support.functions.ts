import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "@/lib/auth-guards.server";

const LimitSchema = z.object({ limit: z.number().int().min(1).max(500).default(500) });

export const getAdminSupportAnalytics = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data: unknown) => LimitSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: conversations, error: conversationsError }, { count: faqCount, error: faqError }] = await Promise.all([
      supabaseAdmin.from("support_conversations").select("id,user_id,messages,resolved,whatsapp_handoff,created_at").order("created_at", { ascending: false }).limit(data.limit),
      supabaseAdmin.from("support_faq").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    if (conversationsError) throw new Error(conversationsError.message);
    if (faqError) throw new Error(faqError.message);
    return { conversations: conversations ?? [], faqCount: Number(faqCount ?? 0) };
  });

export const getAdminSupportGaps = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data: unknown) => LimitSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: logs, error: logError }, { data: conversations, error: conversationError }] = await Promise.all([
      supabaseAdmin.from("support_chat_log").select("question,created_at,matched_article_id").is("matched_article_id", null).order("created_at", { ascending: false }).limit(data.limit),
      supabaseAdmin.from("support_conversations").select("messages,created_at,updated_at").order("updated_at", { ascending: false }).limit(data.limit),
    ]);
    if (logError) throw new Error(logError.message);
    if (conversationError) throw new Error(conversationError.message);
    return { logs: logs ?? [], conversations: conversations ?? [] };
  });
