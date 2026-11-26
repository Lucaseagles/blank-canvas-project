import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import type { ReferralTier } from "./supabase/tiers";

const TierInput = z.object({
  tier_name: z.string().trim().min(1).max(120),
  tier_key: z.string().trim().regex(/^[a-z0-9_-]{1,80}$/),
  min_referrals: z.number().int().min(0).max(2_000_000_000),
  reward_description: z.string().trim().min(1).max(1000),
  icon: z.string().trim().min(1).max(32),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  is_active: z.boolean(),
  display_order: z.number().int().min(0).max(2_000_000_000),
});

const db = async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
};

export const getAdminReferralTiers = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const client = await db();
    const { data, error } = await client.from("referral_tiers").select("*").order("display_order", { ascending: true }).order("min_referrals", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ReferralTier[];
  });

export const createAdminReferralTier = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((input: unknown) => TierInput.parse(input))
  .handler(async ({ data, context }) => {
    const client = await db();
    const { data: row, error } = await client.rpc("rubi_create_referral_tier_audited", {
      p_data: data,
      p_actor: context.userId,
    });
    if (error) throw error;
    if (!row) throw new Error("Nível de recompensa não foi criado.");
    return row as ReferralTier;
  });

export const updateAdminReferralTier = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((input: unknown) => z.object({
    id: z.string().uuid(),
    expectedUpdatedAt: z.string().datetime({ offset: true }).nullable(),
    patch: TierInput,
  }).parse(input))
  .handler(async ({ data, context }) => {
    const client = await db();
    const { data: row, error } = await client.rpc("rubi_update_referral_tier_audited", {
      p_id: data.id,
      p_expected_updated_at: data.expectedUpdatedAt,
      p_patch: data.patch,
      p_actor: context.userId,
    });
    if (error) throw error;
    if (!row) throw new Error("Nível alterado por outra operação ou não encontrado. Atualize a lista e tente novamente.");
    return row as ReferralTier;
  });

export const deactivateAdminReferralTier = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((input: unknown) => z.object({
    id: z.string().uuid(),
    expectedUpdatedAt: z.string().datetime({ offset: true }).nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const client = await db();
    const { data: row, error } = await client.rpc("rubi_deactivate_referral_tier_audited", {
      p_id: data.id,
      p_expected_updated_at: data.expectedUpdatedAt,
      p_actor: context.userId,
    });
    if (error) throw error;
    if (!row) throw new Error("Nível alterado por outra operação ou não encontrado. Atualize a lista e tente novamente.");
    return row as ReferralTier;
  });
