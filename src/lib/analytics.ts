import { supabase } from "@/integrations/supabase/client";

/**
 * Technical Safeguard: Filters out clicks from owner accounts to protect affiliate commissions.
 * @param userId UUID of the user
 */
async function isOwnerAccount(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase.rpc('has_role', { 
    _user_id: userId, 
    _role: 'owner' 
  });
  return !!data;
}


/**
 * Tracks an analytics event to Supabase
 * @param eventType Type of event (e.g., 'product_view', 'click_affiliate')
 * @param metadata Additional JSON metadata
 */
export async function trackEvent(
  eventType: string, 
  metadata: Record<string, any> = {}, 
  options: { campaignId?: string; source?: string } = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Requirement 3: Technical safeguard against autoclick reporting
  if (user && await isOwnerAccount(user.id)) {
    console.info(`[Compliance] Skipping audit log for owner activity: ${eventType}`);
    return;
  }

  
  // Merge campaign data into metadata
  const finalMetadata: Record<string, any> = {
    ...metadata,
    campaign_id: options.campaignId || metadata['campaign_id'] || null,
    utm_source: options.source || metadata['utm_source'] || null,
  };

  const { error } = await supabase
    .from('analytics_events')
    .insert({
      user_id: user?.id ?? null,
      event_type: eventType,
      metadata: finalMetadata as any
    });

  if (error) {
    console.error(`Error tracking event ${eventType}:`, error);
  }
}

/**
 * Tracks an outbound click to a marketplace/affiliate link
 * @param productId The ID of the product being clicked
 * @param marketplace The name/slug of the marketplace
 * @param affiliateUrl The destination URL
 * @param options Campaign context
 */
export async function trackOutboundClick(
  productId: string, 
  marketplace: string, 
  affiliateUrl: string,
  options: { campaignId?: string; source?: string } = {}
) {
  await trackEvent('OUTBOUND_CLICK', {
    product_id: productId,
    marketplace,
    url: affiliateUrl,
    timestamp: new Date().toISOString()
  }, options);
}
