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

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ campaign: CampaignSchema, channels: z.array(CampaignChannel).max(5), productIds: z.array(UUID).max(500), socialChannelId: UUID.optional() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { campaign, channels, productIds, socialChannelId } = data;
    const startsAt = new Date(campaign.starts_at);
    const endsAt = new Date(campaign.ends_at);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new Error("Invalid campaign date range");
    }
    if (campaign.status === "active" && endsAt <= new Date()) {
      throw new Error("An active campaign must end in the future");
    }
    if (campaign.status === "active" && channels.length === 0) {
      throw new Error("An active campaign must have at least one channel");
    }
    if (campaign.status === "active" && productIds.length === 0) {
      throw new Error("An active campaign must have at least one product");
    }

    let campaignId = campaign.id;
    if (campaignId) {
      const { error } = await supabaseAdmin.from("campaigns").update({ name: campaign.name, description: campaign.description || null, starts_at: campaign.starts_at, ends_at: campaign.ends_at, status: campaign.status, updated_at: new Date().toISOString() }).eq("id", campaignId);
      if (error) throw error;
    } else {
      const { data: created, error } = await supabaseAdmin.from("campaigns").insert({ name: campaign.name, description: campaign.description || null, starts_at: campaign.starts_at, ends_at: campaign.ends_at, status: campaign.status }).select("id").single();
      if (error) throw error;
      campaignId = created.id;
    }
    const { error: channelDeleteError } = await supabaseAdmin.from("campaign_channels").delete().eq("campaign_id", campaignId);
    if (channelDeleteError) throw channelDeleteError;
    if (channels.length) {
      const { error } = await supabaseAdmin.from("campaign_channels").insert(channels.map((channel) => ({ campaign_id: campaignId, channel, is_enabled: true, config: channel === "SOCIAL_FOLLOW" ? { social_channel_id: socialChannelId ?? null } : {} })));
      if (error) throw error;
    }
    const { error: productDeleteError } = await supabaseAdmin.from("campaign_products").delete().eq("campaign_id", campaignId);
    if (productDeleteError) throw productDeleteError;
    if (productIds.length) {
      const { data: validProducts, error } = await supabaseAdmin.from("products").select("id").in("id", productIds);
      if (error) throw error;
      const validIds = new Set((validProducts ?? []).map((product) => product.id));
      const invalidIds = productIds.filter((id) => !validIds.has(id));
      if (invalidIds.length) throw new Error("One or more selected products no longer exist");
      const { error: insertError } = await supabaseAdmin.from("campaign_products").insert(productIds.map((product_id) => ({ campaign_id: campaignId, product_id })));
      if (insertError) throw insertError;
    }
    return { success: true, id: campaignId };
  });

export const setCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: UUID, status: CampaignStatus }).parse(data))
  .handler(async ({ data: { id, status } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: campaign, error: fetchError } = await supabaseAdmin.from("campaigns").select("id,starts_at,ends_at").eq("id", id).single();
    if (fetchError) throw fetchError;
    if (status === "active") {
      if (new Date(campaign.ends_at) <= new Date()) throw new Error("Cannot activate an expired campaign");
      const [{ count: channelCount, error: channelError }, { count: productCount, error: productError }] = await Promise.all([
        supabaseAdmin.from("campaign_channels").select("id", { count: "exact", head: true }).eq("campaign_id", id).eq("is_enabled", true),
        supabaseAdmin.from("campaign_products").select("id", { count: "exact", head: true }).eq("campaign_id", id),
      ]);
      if (channelError) throw channelError;
      if (productError) throw productError;
      if (!channelCount) throw new Error("Cannot activate a campaign without an active channel");
      if (!productCount) throw new Error("Cannot activate a campaign without a linked product");
    }
    const { error } = await supabaseAdmin.from("campaigns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    return { success: true, id, status };
  });

export const terminateCampaign = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ id: UUID }).parse(data)).handler(async ({ data: { id } }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing, error: fetchError } = await supabaseAdmin.from("campaigns").select("id,status").eq("id", id).single();
  if (fetchError) throw fetchError;
  if (existing.status === "ended") return { success: true, id, status: "ended" };
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("campaigns").update({ status: "ended", ends_at: now, updated_at: now }).eq("id", id);
  if (error) throw error;
  return { success: true, id, status: "ended" };
});

export const duplicateCampaign = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ id: UUID }).parse(data)).handler(async ({ data: { id } }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing, error: fetchError } = await supabaseAdmin.from("campaigns").select("*, campaign_channels(*), campaign_products(product_id)").eq("id", id).single();
  if (fetchError) throw fetchError;
  const { data: created, error: createError } = await supabaseAdmin.from("campaigns").insert({ name: `${existing.name} (Copy)`.slice(0, 200), description: existing.description, starts_at: existing.starts_at, ends_at: existing.ends_at, status: "scheduled" }).select("id").single();
  if (createError) throw createError;
  const newId = created.id;
  try {
    if (existing.campaign_channels?.length) {
      const { error } = await supabaseAdmin.from("campaign_channels").insert(existing.campaign_channels.map((c: any) => ({ campaign_id: newId, channel: c.channel, is_enabled: c.is_enabled, config: c.config })));
      if (error) throw error;
    }
    if (existing.campaign_products?.length) {
      const { error } = await supabaseAdmin.from("campaign_products").insert(existing.campaign_products.map((p: any) => ({ campaign_id: newId, product_id: p.product_id })));
      if (error) throw error;
    }
  } catch (error) {
    await supabaseAdmin.from("campaigns").delete().eq("id", newId);
    throw error;
  }
  return { success: true, id: newId };
});

export const getCampaignFunnelData = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ campaignId: UUID }).parse(data)).handler(async ({ data: { campaignId } }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("get_campaign_funnel", { _campaign_id: campaignId });
  if (error) throw error;
  return data ?? [];
});
