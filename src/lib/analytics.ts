import { supabase } from "@/integrations/supabase/client";

// Keep identity keys aligned with the app shell's SESSION_START event so
// analytics_events rows from both writers join into one customer journey.
const ANON_KEY = "analytics_anonymous_id";
const SESSION_KEY = "analytics_session_id";

function stableId(key: string): string {
  if (typeof window === "undefined") return "";
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
  }
  return value;
}

function sessionId(): string {
  if (typeof window === "undefined") return "";
  let value = window.sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

async function isOwnerAccount(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "owner" });
  return !!data;
}

export type AnalyticsOptions = {
  campaignId?: string;
  source?: string;
  productId?: string;
  categoryId?: string;
  sessionId?: string;
  anonymousId?: string;
};

/** Canonical client-side analytics writer. Resolves true only after the insert succeeds. */
export async function trackEvent(
  eventName: string,
  metadata: Record<string, any> = {},
  options: AnalyticsOptions = {}
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && await isOwnerAccount(user.id)) return false;

    const anonymousId = options.anonymousId || stableId(ANON_KEY);
    const currentSessionId = options.sessionId || sessionId();
    const productId = options.productId || metadata['product_id'] || undefined;
    const categoryId = options.categoryId || metadata['category_id'] || undefined;
    const campaignId = options.campaignId || metadata['campaign_id'] || undefined;
    const source = options.source || metadata['source'] || metadata['utm_source'] || undefined;

    const { error } = await supabase.from("analytics_events").insert({
      user_id: user?.id ?? null,
      event_type: eventName,
      event_name: eventName,
      anonymous_id: user ? null : anonymousId,
      session_id: currentSessionId || null,
      product_id: productId || null,
      category_id: categoryId || null,
      campaign_id: campaignId || null,
      source: source || null,
      metadata: {
        ...metadata,
        campaign_id: campaignId || metadata['campaign_id'] || null,
        source: source || metadata['source'] || null,
        session_id: currentSessionId || null,
      },
    });

    if (error) {
      console.error(`Error tracking event ${eventName}:`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Analytics failure for ${eventName}:`, error);
    return false;
  }
}

export const trackDiscoveryEvent = (
  eventName: "product_repeat_view" | "banner_view" | "popup_view" | "popup_click" | "popup_dismiss" | "recommendation_view" | "recommendation_click" | "promotion_view" | "promotion_click",
  metadata: Record<string, any> = {},
  options: AnalyticsOptions = {},
) => trackEvent(eventName, metadata, options);

export async function trackOutboundClick(
  productId: string,
  marketplace: string,
  affiliateUrl: string,
  options: AnalyticsOptions = {}
) {
  let destinationHost: string | null = null;
  try {
    destinationHost = new URL(affiliateUrl).hostname;
  } catch {
    // Invalid destinations are handled by the checkout/redirect validator.
    // Analytics must not persist the raw URL as a fallback.
  }

  await trackEvent("OUTBOUND_CLICK", {
    product_id: productId,
    marketplace,
    destination_host: destinationHost,
    timestamp: new Date().toISOString(),
  }, { ...options, productId });
}
