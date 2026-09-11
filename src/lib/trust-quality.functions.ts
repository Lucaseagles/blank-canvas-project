import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "./auth-guards.server";

export const getTrustQualityOverview = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const [{ data: products, error: productsError }, { data: rules, error: rulesError }, { data: violations, error: violationsError }] = await Promise.all([
      db.from("products").select("id,title,status,rating,review_count,affiliate_url,current_price,description,images").limit(500),
      db.from("compliance_rules").select("id,marketplace_id,rule_key,is_enforced,reviewed_at").limit(500),
      db.from("compliance_audit_log").select("id,marketplace_id,product_id,rule_key,violation_detail,detected_at").order("detected_at", { ascending: false }).limit(100),
    ]);

    const errors = [productsError, rulesError, violationsError].filter(Boolean).map((error: any) => String(error.message));
    if (errors.length) throw new Error(errors.join(" | "));

    const rows = (products ?? []).map((product: any) => {
      const issues: string[] = [];
      if (!String(product.title ?? "").trim()) issues.push("missing_title");
      if (!String(product.description ?? "").trim()) issues.push("missing_description");
      if (!String(product.affiliate_url ?? "").trim()) issues.push("missing_affiliate_url");
      if (product.current_price == null || Number(product.current_price) <= 0) issues.push("invalid_price");
      if (product.rating != null && (Number(product.rating) < 0 || Number(product.rating) > 5)) issues.push("invalid_rating");
      if (product.review_count != null && Number(product.review_count) < 0) issues.push("invalid_review_count");
      const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
      if (images.length === 0) issues.push("missing_images");
      return { id: product.id, title: product.title, status: product.status, issues, score: Math.max(0, 100 - issues.length * 15) };
    });

    const enforcedRules = (rules ?? []).filter((rule: any) => rule.is_enforced).length;
    const unreviewedRules = (rules ?? []).filter((rule: any) => !rule.reviewed_at).length;
    const productsWithIssues = rows.filter((row: any) => row.issues.length > 0);
    const averageScore = rows.length ? Math.round(rows.reduce((sum: number, row: any) => sum + row.score, 0) / rows.length) : 0;

    return {
      summary: { products: rows.length, productsWithIssues: productsWithIssues.length, averageScore, complianceRules: rules?.length ?? 0, enforcedRules, unreviewedRules, recentViolations: violations?.length ?? 0 },
      products: productsWithIssues.sort((a: any, b: any) => a.score - b.score).slice(0, 50),
      violations: violations ?? [],
    };
  });
