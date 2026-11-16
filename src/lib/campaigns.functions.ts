import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const CampaignSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional(),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }),
  status: z.enum(["scheduled", "active", "paused", "ended"]).default("scheduled"),
}).refine((c) => new Date(c.ends_at) > new Date(c.starts_at), { message: "End date must be after start date", path: ["ends_at"] });

const CampaignChannel = z.enum(["FEED_BANNER", "PUSH", "TELEGRAM", "REFERRAL_BOOST", "SOCIAL_FOLLOW"]);
const UUID = z.string().uuid();
const CampaignStatus = z.enum(["scheduled", "active", "paused", "ended"]);

export const getAdminCampaigns = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("campaigns").select("*, campaign_channels(*), campaign_products(product_id)").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

/** Persist the campaign and all child rows with its Owner audit in one transaction. */
export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    campaign: CampaignSchema, channels: z.array(CampaignChannel).max(5),
    productIds: z.array(UUID).max(500), socialChannelId: UUID.optional()
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: changed, error } = await (supabaseAdmin as any).rpc("rubi_mutate_legacy_campaign_audited", {
      p_action: "save", p_campaign_id: data.campaign.id ?? null, p_payload: data.campaign, p_channels: data.channels, p_product_ids: data.productIds, p_social_channel_id: data.socialChannelId ?? null, p_actor: context.userId
    });
    if (error) throw new Error(error.message);
    if (!changed?.id) throw new Error("A operação e sua auditoria não foram registradas.");
    return { success: true, id: String(changed.id) };
  });

export const setCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({ id: UUID, status: CampaignStatus }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: changed, error } = await (supabaseAdmin as any).rpc("rubi_mutate_legacy_campaign_audited", {
      p_action: "status", p_campaign_id: data.id, p_payload: {status: data.status}, p_channels: [], p_product_ids: [], p_social_channel_id: null, p_actor: context.userId
    });
    if (error) throw new Error(error.message);
    if (!changed?.id) throw new Error("A operação e sua auditoria não foram registradas.");
    return { success: true, id: String(changed.id), status: String(changed.status) };
  });

export const terminateCampaign = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({ id: UUID }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: changed, error } = await (supabaseAdmin as any).rpc("rubi_mutate_legacy_campaign_audited", {
      p_action: "terminate", p_campaign_id: data.id, p_payload: {}, p_channels: [], p_product_ids: [], p_social_channel_id: null, p_actor: context.userId
    });
    if (error) throw new Error(error.message);
    if (!changed?.id) throw new Error("A operação e sua auditoria não foram registradas.");
    return { success: true, id: String(changed.id), status: "ended" };
  });

export const duplicateCampaign = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({ id: UUID }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: changed, error } = await (supabaseAdmin as any).rpc("rubi_mutate_legacy_campaign_audited", {
      p_action: "duplicate", p_campaign_id: data.id, p_payload: {}, p_channels: [], p_product_ids: [], p_social_channel_id: null, p_actor: context.userId
    });
    if (error) throw new Error(error.message);
    if (!changed?.id) throw new Error("A operação e sua auditoria não foram registradas.");
    return { success: true, id: String(changed.id) };
  });

export const getCampaignFunnelData = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ campaignId: UUID }).parse(data)).handler(async ({ data: { campaignId } }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("get_campaign_funnel", { _campaign_id: campaignId });
  if (error) throw error;
  return data ?? [];
});
