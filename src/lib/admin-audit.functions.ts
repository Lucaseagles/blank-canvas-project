import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export type AuditStatus = "functional" | "bug" | "no_data" | "no_ui" | "unavailable";

export type AuditItem = {
  key: string;
  category: string;
  label: string;
  route?: string;
  table?: string;
  status: AuditStatus;
  detail: string;
  checkedAt: string;
};

type AuditDefinition = {
  key: string;
  category: string;
  label: string;
  route?: string;
  table?: string;
  required?: boolean;
};

// Controlled registry: labels never get guessed into SQL table names.
// Add a definition only when the corresponding route/table is actually part of the product.
const AUDIT_REGISTRY: AuditDefinition[] = [
  { key: "profiles", category: "Core", label: "Profiles", table: "profiles", required: true },
  { key: "products", category: "Catalog", label: "Products", table: "products", route: "/admin/products", required: true },
  { key: "categories", category: "Catalog", label: "Categories", table: "categories", route: "/admin/categories", required: true },
  { key: "marketplaces", category: "Catalog", label: "Marketplaces", table: "marketplaces", route: "/admin/marketplaces", required: true },
  { key: "videos", category: "Content", label: "Videos", table: "videos", route: "/videos", required: true },
  { key: "analytics_events", category: "Analytics", label: "Analytics Events", table: "analytics_events", route: "/admin/analytics", required: true },
  { key: "favorites", category: "Engagement", label: "Favorites", table: "favorites" },
  { key: "price_alerts", category: "Engagement", label: "Price Alerts", table: "price_alerts" },
  { key: "referrals", category: "Growth", label: "Referrals", table: "referrals" },
  { key: "referral_events", category: "Growth", label: "Referral Events", table: "referral_events" },
  { key: "social_channels", category: "Growth", label: "Social Channels", table: "social_channels", route: "/admin/social-channels" },
  { key: "campaigns", category: "Automation", label: "Campaigns", table: "campaigns", route: "/admin/campaigns" },
  { key: "campaign_channels", category: "Automation", label: "Campaign Channels", table: "campaign_channels" },
  { key: "scheduled_posts", category: "Publishing", label: "Scheduled Posts", table: "scheduled_posts", route: "/admin/publishing" },
  { key: "home_modules_config", category: "Configuration", label: "Home Modules", table: "home_modules_config", route: "/admin/modules" },
  { key: "badges_config", category: "Configuration", label: "Badges", table: "badges_config", route: "/admin/modules" },
  { key: "external_channel_metrics", category: "Metrics", label: "External Channel Metrics", table: "external_channel_metrics", route: "/admin/metrics" },
  { key: "integration_credentials", category: "Integrations", label: "Integration Credentials", table: "integration_credentials", route: "/admin/integrations", required: true },
  { key: "integration_platforms", category: "Integrations", label: "Integration Platforms", table: "integration_platforms", route: "/admin/integrations" },
  { key: "admin_audit_log", category: "Security", label: "Admin Audit Log", table: "admin_audit_log", route: "/admin/audit", required: true },
];

const AuditInputSchema = z.object({
  includeOptional: z.boolean().default(true),
});

async function tableHealth(supabaseAdmin: any, table: string): Promise<{ status: AuditStatus; detail: string }> {
  const { count, error } = await supabaseAdmin.from(table).select("*", { count: "exact", head: true });
  if (error) return { status: "unavailable", detail: `Tabela inacessível: ${error.message}` };
  if ((count ?? 0) === 0) return { status: "no_data", detail: "Tabela acessível, mas sem registros." };
  return { status: "functional", detail: `${count} registro(s) disponível(is).` };
}

export const runAdminAudit = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => AuditInputSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const checkedAt = new Date().toISOString();
    const definitions = data.includeOptional ? AUDIT_REGISTRY : AUDIT_REGISTRY.filter((item) => item.required);

    const items: AuditItem[] = await Promise.all(
      definitions.map(async (definition) => {
        if (!definition.table) {
          return { ...definition, status: "unavailable" as AuditStatus, detail: "Nenhuma verificação de persistência definida.", checkedAt };
        }
        const health = await tableHealth(supabaseAdmin, definition.table);
        return { ...definition, ...health, checkedAt };
      }),
    );

    const stats = items.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] += 1;
        return acc;
      },
      { total: 0, functional: 0, bug: 0, no_data: 0, no_ui: 0, unavailable: 0 } as Record<string, number>,
    );

    // The audit itself is intentionally logged after all checks. Failure to write the
    // audit record must not turn a successful health check into a false product failure.
    const { error: logError } = await supabaseAdmin.from("admin_audit_log").insert({
      action: "ADMIN_AUDIT_RUN",
      entity_type: "system",
      entity_id: null,
      metadata: { stats, checked_items: items.length },
    } as any);

    return {
      items,
      stats,
      checkedAt,
      auditLogWritten: !logError,
      auditLogError: logError?.message ?? null,
    };
  });
