import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";


export const getComplianceRules = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .validator((data: { marketplaceId: string }) => z.object({ marketplaceId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { marketplaceId } }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin
      .from("compliance_rules" as any)
      .select("*")
      .eq("marketplace_id", marketplaceId);
    
    if (error) throw error;
    return data || [];
  });

export const saveComplianceRule = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: {
    id?: string;
    marketplace_id: string;
    rule_key: string;
    rule_value: any;
    is_enforced: boolean;
    notes?: string;
    source_url?: string;
  }) => z.object({
    id: z.string().uuid().optional(),
    marketplace_id: z.string().uuid(),
    rule_key: z.string(),
    rule_value: z.any(),
    is_enforced: z.boolean(),
    notes: z.string().optional(),
    source_url: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin
      .from("compliance_rules" as any)
      .upsert({
        ...data,
        reviewed_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return { success: true };
  });

/** Validate the actual parsed hostname; substring matching accepts spoofed domains. */
export function validateExternalAffiliateDestination(raw: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  let destination: URL;
  try { destination = new URL(raw); }
  catch { return { valid: false, violations: ["Invalid affiliate URL"] }; }
  if (destination.protocol !== "https:" || destination.username || destination.password ||
      destination.port || !destination.hostname.includes(".")) {
    violations.push("Affiliate destination must be standard HTTPS without embedded credentials");
  }
  const hostname = destination.hostname.toLowerCase().replace(/\\.$/, "");
  const forbiddenDomains = ["bit.ly", "tinyurl.com", "t.co", "goo.gl"];
  if (forbiddenDomains.some(domain => hostname === domain || hostname.endsWith("." + domain))) {
    violations.push("Unauthorized link shortener detected");
  }
  return { valid: violations.length === 0, violations };
}

export const validateAffiliateLink = createServerFn({ method: "POST" })
  .validator((data: { url: string; marketplaceId: string }) => 
    z.object({ 
      url: z.string().url(), 
      marketplaceId: z.string().uuid() 
    }).parse(data)
  )
  .handler(async ({ data: { url, marketplaceId } }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // Fetch rules for this marketplace
    const { data: _rules } = await supabaseAdmin
      .from("compliance_rules" as any)
      .select("*")
      .eq("marketplace_id", marketplaceId)
      .eq("is_enforced", true);
    // Marketplace-specific compliance rules remain available for future provider contracts.

    const violations: string[] = [];

    violations.push(...validateExternalAffiliateDestination(url).violations);

    if (violations.length > 0) {
      // Log violations
      await supabaseAdmin.from("compliance_audit_log" as any).insert(
        violations.map(v => ({
          marketplace_id: marketplaceId,
          rule_key: "link_validation",
          violation_detail: v
        }))
      );
      return { valid: false, violations };
    }

    return { valid: true };
  });

export const getComplianceAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin
      .from("compliance_audit_log" as any)
      .select(`
        *,
        marketplaces (name),
        products (title)
      `)
      .order("detected_at", { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  });
