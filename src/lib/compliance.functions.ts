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
    const { data: rules } = await supabaseAdmin
      .from("compliance_rules" as any)
      .select("*")
      .eq("marketplace_id", marketplaceId)
      .eq("is_enforced", true);

    const violations: string[] = [];

    // Rule: No unknown shorteners (simple heuristic for this sprint)
    const forbiddenDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl'];
    if (forbiddenDomains.some(domain => url.includes(domain))) {
      violations.push("Unauthorized link shortener detected");
    }

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
