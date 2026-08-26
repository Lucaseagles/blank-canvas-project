import { z } from "zod";

/**
 * Normalized Product data structure from connectors
 */
export interface NormalizedProduct {
  externalId: string;
  title: string;
  description?: string;
  price: number;
  previousPrice?: number;
  discount?: number;
  imageUrl?: string;
  affiliateUrl: string;
  category?: string;
  marketplaceId: string;
  rating?: number;
  reviewCount?: number;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'NOT_SUPPORTED';
  metadata?: Record<string, any>;
}

/**
 * Interface for Marketplace Connectors
 */
export interface MarketplaceConnector {
  readonly id: string;
  readonly name: string;
  
  /**
   * Test connectivity and validate credentials
   */
  testConnection(credentials: Record<string, any>): Promise<{ success: boolean; message?: string }>;
  
  /**
   * Search for products in the marketplace
   */
  searchProducts(query: string, options?: { limit?: number; category?: string }): Promise<NormalizedProduct[]>;
  
  /**
   * Get specific product details
   */
  getProduct(externalId: string): Promise<NormalizedProduct>;
  
  /**
   * Refresh price and availability for a product
   */
  syncProduct(externalId: string): Promise<Pick<NormalizedProduct, 'price' | 'previousPrice' | 'discount' | 'availability'>>;
  
  /**
   * Generate an affiliate link for a product/URL
   */
  getAffiliateLink(externalId: string, customParameters?: Record<string, string>): Promise<string>;
}

/**
 * Zod schema for marketplace credentials
 */
export const MarketplaceCredentialsSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  apiKey: z.string().optional(),
  trackingId: z.string().optional(),
  appId: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export type MarketplaceCredentials = z.infer<typeof MarketplaceCredentialsSchema>;
