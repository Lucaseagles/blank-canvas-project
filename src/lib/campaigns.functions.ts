import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";


const CampaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3),
  description: z.string().optional(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.enum(["scheduled", "active", "paused", "ended"]).default("scheduled"),
});

export const getAdminCampaigns = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("campaigns" as any)
      .select(`
        *,
        campaign_channels(*),
        campaign_products(product_id)
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  });

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({
    campaign: CampaignSchema,
    channels: z.array(z.enum(["FEED_BANNER", "PUSH", "TELEGRAM", "REFERRAL_BOOST"])),
    productIds: z.array(z.string())
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { campaign, channels, productIds } = data;
    
    let campaignId = campaign.id;
    
    if (campaignId) {
      const { error } = await supabaseAdmin
        .from("campaigns" as any)
        .update({
          name: campaign.name,
          description: campaign.description,
          starts_at: campaign.starts_at,
          ends_at: campaign.ends_at,
          status: campaign.status,
          updated_at: new Date().toISOString()
        } as any)
        .eq("id", campaignId);
      if (error) throw error;
    } else {
      const { data: newCampaign, error } = await supabaseAdmin
        .from("campaigns" as any)
        .insert({
          name: campaign.name,
          description: campaign.description,
          starts_at: campaign.starts_at,
          ends_at: campaign.ends_at,
          status: campaign.status
        } as any)
        .select()
        .single();
      if (error) throw error;
      campaignId = (newCampaign as any).id;
    }

    // Update channels
    await supabaseAdmin.from("campaign_channels" as any).delete().eq("campaign_id", campaignId);
    if (channels.length > 0) {
      const channelInserts = channels.map(channel => ({
        campaign_id: campaignId,
        channel,
        is_enabled: true
      }));
      await supabaseAdmin.from("campaign_channels" as any).insert(channelInserts);
    }

    // Update products
    await supabaseAdmin.from("campaign_products" as any).delete().eq("campaign_id", campaignId);
    if (productIds.length > 0) {
      const productInserts = productIds.map(productId => ({
        campaign_id: campaignId,
        product_id: productId
      }));
      await supabaseAdmin.from("campaign_products" as any).insert(productInserts);
    }

    return { success: true, id: campaignId };
  });

export const duplicateCampaign = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data: { id } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Get existing
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("campaigns" as any)
      .select(`
        *,
        campaign_channels(*),
        campaign_products(product_id)
      `)
      .eq("id", id)
      .single();
    
    if (fetchError) throw fetchError;
    const campaignData = existing as any;

    // Create new
    const { data: newCampaign, error: createError } = await supabaseAdmin
      .from("campaigns" as any)
      .insert({
        name: `${campaignData.name} (Copy)`,
        description: campaignData.description,
        starts_at: campaignData.starts_at,
        ends_at: campaignData.ends_at,
        status: "scheduled"
      } as any)
      .select()
      .single();
    
    if (createError) throw createError;
    const newId = (newCampaign as any).id;

    // Duplicate channels
    if (campaignData.campaign_channels?.length > 0) {
      const channelInserts = campaignData.campaign_channels.map((c: any) => ({
        campaign_id: newId,
        channel: c.channel,
        is_enabled: c.is_enabled,
        config: c.config
      }));
      await supabaseAdmin.from("campaign_channels" as any).insert(channelInserts);
    }

    // Duplicate products
    if (campaignData.campaign_products?.length > 0) {
      const productInserts = campaignData.campaign_products.map((p: any) => ({
        campaign_id: newId,
        product_id: p.product_id
      }));
      await supabaseAdmin.from("campaign_products" as any).insert(productInserts);
    }

    return { success: true, id: newId };
  });

export const getCampaignFunnelData = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ campaignId: z.string() }).parse(data))
  .handler(async ({ data: { campaignId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .rpc("get_campaign_funnel" as any, { _campaign_id: campaignId });
    
    if (error) throw error;
    return data || [];
  });
