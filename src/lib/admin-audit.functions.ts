import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export type AuditStatus = "functional" | "bug" | "no_data" | "no_ui" | "unavailable";
export type AuditItem = { key: string; category: string; label: string; route?: string; table?: string; status: AuditStatus; detail: string; checkedAt: string };
type AuditDefinition = { key: string; category: string; label: string; route?: string; table?: string; required?: boolean };
export type AuditStats = { total: number; functional: number; bug: number; no_data: number; no_ui: number; unavailable: number };

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

const AuditInputSchema = z.object({ includeOptional: z.boolean().default(true) });

async function tableHealth(supabaseAdmin: any, definition: AuditDefinition): Promise<{ status: AuditStatus; detail: string }> {
  const { count, error } = await supabaseAdmin.from(definition.table).select("*", { count: "exact", head: true });
  if (error) return definition.required ? { status: "bug", detail: `Dependência crítica inacessível: ${error.message}` } : { status: "unavailable", detail: `Tabela inacessível: ${error.message}` };
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
    const items: AuditItem[] = await Promise.all(definitions.map(async (definition) => {
      if (!definition.table) return { ...definition, status: "no_ui" as AuditStatus, detail: "Nenhuma tabela ou verificação de persistência definida.", checkedAt };
      const health = await tableHealth(supabaseAdmin, definition);
      return { ...definition, ...health, checkedAt };
    }));

    const stats: AuditStats = { total: 0, functional: 0, bug: 0, no_data: 0, no_ui: 0, unavailable: 0 };
    for (const item of items) {
      stats.total += 1;
      stats[item.status] += 1;
    }

    const { error: logError } = await (supabaseAdmin as any).from("admin_audit_log").insert({
      actor_user_id: null,
      actor_email: "eaglesfr49@gmail.com",
      action_type: "ADMIN_AUDIT_RUN",
      entity_type: "system",
      entity_id: null,
      previous_value: null,
      new_value: { stats, checked_items: items.length },
    });

    return { items, stats, checkedAt, auditLogWritten: !logError, auditLogError: logError?.message ?? null };
  });
