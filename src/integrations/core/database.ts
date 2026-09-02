import type { PlatformConfig } from "./types";

export type IntegrationDbStatus = {
  platform_id: string;
  status: "pending" | "active" | "error";
  last_checked_at: string | null;
  last_error: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminIntegrationState = {
  integrations: Record<string, boolean>;
  sectors: {
    videos: boolean;
    videoBridge: boolean;
    products: boolean;
    marketplaces: boolean;
    notifications: boolean;
    offers: boolean;
    socialProof: boolean;
  };
};

/** Converts database rows into a stable lookup without exposing secrets. */
export function indexIntegrationStatuses(rows: IntegrationDbStatus[]) {
  return Object.fromEntries(rows.map((row) => [row.platform_id, row]));
}

/**
 * Derives admin/customer feature availability from confirmed active integrations.
 * This is intentionally based on connection status, never on the presence of a
 * credential value, so merely saving a secret cannot falsely activate a sector.
 */
export function deriveAdminIntegrationState(rows: IntegrationDbStatus[], platforms: PlatformConfig[]): AdminIntegrationState {
  const active = new Set(rows.filter((row) => row.status === "active").map((row) => row.platform_id));
  const integrations = Object.fromEntries(platforms.map((platform) => [platform.id, active.has(platform.id)]));
  const anyMarketplace = platforms.some((platform) => platform.category === "marketplace" && active.has(platform.id));

  return {
    integrations,
    sectors: {
      videos: active.has("tiktok_shop"),
      videoBridge: active.has("tiktok_shop"),
      products: active.has("shopee") || anyMarketplace,
      marketplaces: active.has("shopee") || anyMarketplace,
      notifications: active.has("whatsapp"),
      // Offers/social proof require a confirmed marketplace, not just any integration.
      offers: anyMarketplace,
      socialProof: anyMarketplace,
    },
  };
}
