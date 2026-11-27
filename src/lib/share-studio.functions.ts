import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const db = async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
};

const templateInput = z.object({
  id: z.string().uuid(),
  caption_template: z.string().trim().min(1).max(4096),
  max_length: z.number().int().min(1).max(4096),
  hashtags: z.array(z.string().trim().min(1).max(80)).max(40),
  is_active: z.boolean(),
});

const cardInput = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  text_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  title: z.string().trim().min(1).max(500),
  subtitle: z.string().trim().min(1).max(500),
  cta: z.string().trim().min(1).max(500),
  reward_label: z.string().trim().min(1).max(500),
});

export const updateAdminShareTemplate = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((input: unknown) => templateInput.parse(input))
  .handler(async ({ data, context }) => {
    const client = await db();
    const { data: row, error } = await client.rpc("rubi_update_share_template_audited", {
      p_template_id: data.id,
      p_caption_template: data.caption_template,
      p_max_length: data.max_length,
      p_hashtags: data.hashtags,
      p_is_active: data.is_active,
      p_actor: context.userId,
    });
    if (error) throw error;
    if (!row) throw new Error("Template social não foi atualizado.");
    return row;
  });

export const updateAdminShareCardConfig = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((input: unknown) => cardInput.parse(input))
  .handler(async ({ data, context }) => {
    const client = await db();
    const { data: row, error } = await client.rpc("rubi_update_share_card_config_audited", {
      p_style: {
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        text_color: data.text_color,
        background: data.background,
        accent_color: data.accent_color,
      },
      p_texts: {
        title: data.title,
        subtitle: data.subtitle,
        cta: data.cta,
        reward_label: data.reward_label,
      },
      p_actor: context.userId,
    });
    if (error) throw error;
    if (!row) throw new Error("Configuração visual social não foi atualizada.");
    return row;
  });
