import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "./auth-guards.server";

type MetricKey =
  | "consumerProfiles" | "consumerNew30d"
  | "merchantProfiles" | "merchantPending" | "merchantApproved" | "merchantNew30d"
  | "partnerProfiles" | "partnerPending" | "partnerApproved" | "partnerNew30d"
  | "activePartnerLinks" | "partnerVisits30d" | "confirmedPartnerSales30d"
  | "catalogProducts" | "retailCheckoutApproved" | "b2bCatalogConfigured";

type Filter = { field: string; value: string | boolean | number };
type CountSpec = {
  key: MetricKey;
  table: string;
  eq?: Filter[];
  gt?: Filter[];
  after?: { field: string; value: string };
};

/**
 * Owner-only, exact-count operational snapshot.
 * Profiles are not interchangeable with unique auth users. Active partner
 * links are not selling partners. Confirmed sales do not prove settlement.
 * No B2B purchase orders are invented from wholesale price simulations.
 */
export const getRubiCommercialPulseAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const specs: CountSpec[] = [
      { key: "consumerProfiles", table: "commercial_profiles", eq: [{ field: "audience", value: "consumer" }] },
      { key: "consumerNew30d", table: "commercial_profiles", eq: [{ field: "audience", value: "consumer" }], after: { field: "created_at", value: since } },
      { key: "merchantProfiles", table: "commercial_profiles", eq: [{ field: "audience", value: "merchant" }] },
      { key: "merchantPending", table: "commercial_profiles", eq: [{ field: "audience", value: "merchant" }, { field: "status", value: "pending" }] },
      { key: "merchantApproved", table: "commercial_profiles", eq: [{ field: "audience", value: "merchant" }, { field: "status", value: "approved" }] },
      { key: "merchantNew30d", table: "commercial_profiles", eq: [{ field: "audience", value: "merchant" }], after: { field: "created_at", value: since } },
      { key: "partnerProfiles", table: "commercial_profiles", eq: [{ field: "audience", value: "partner" }] },
      { key: "partnerPending", table: "commercial_profiles", eq: [{ field: "audience", value: "partner" }, { field: "status", value: "pending" }] },
      { key: "partnerApproved", table: "commercial_profiles", eq: [{ field: "audience", value: "partner" }, { field: "status", value: "approved" }] },
      { key: "partnerNew30d", table: "commercial_profiles", eq: [{ field: "audience", value: "partner" }], after: { field: "created_at", value: since } },
      { key: "activePartnerLinks", table: "hub_partner_referral_links", eq: [{ field: "active", value: true }] },
      { key: "partnerVisits30d", table: "hub_partner_referral_visits", after: { field: "visited_at", value: since } },
      { key: "confirmedPartnerSales30d", table: "hub_partner_confirmed_sales", after: { field: "confirmed_at", value: since } },
      { key: "catalogProducts", table: "hub_products" },
      { key: "retailCheckoutApproved", table: "hub_products", eq: [{ field: "active", value: true }, { field: "checkout_verified", value: true }], gt: [{ field: "retail_price", value: 0 }] },
      { key: "b2bCatalogConfigured", table: "hub_products", eq: [{ field: "active", value: true }], gt: [{ field: "b2b_base_price", value: 0 }] },
    ];
    const results = await Promise.all(specs.map(async (spec) => {
      let query = (supabaseAdmin as any).from(spec.table).select("id", { count: "exact", head: true });
      for (const predicate of spec.eq ?? []) query = query.eq(predicate.field, predicate.value);
      for (const predicate of spec.gt ?? []) query = query.gt(predicate.field, predicate.value);
      if (spec.after) query = query.gte(spec.after.field, spec.after.value);
      const { count, error } = await query;
      if (error) throw error;
      // Count=0 is a legitimate result; never silently substitute 0 on errors.
      if (count === null || count === undefined) throw new Error("Contagem comercial indisponível.");
      return [spec.key, count] as const;
    }));
    const counts = Object.fromEntries(results) as Record<MetricKey, number>;
    return {
      periodDays: 30,
      asOf: new Date().toISOString(),
      consumer: { profiles: counts.consumerProfiles, newProfiles30d: counts.consumerNew30d },
      merchant: {
        profiles: counts.merchantProfiles, pending: counts.merchantPending,
        approved: counts.merchantApproved, newProfiles30d: counts.merchantNew30d,
        b2bCatalogConfigured: counts.b2bCatalogConfigured,
      },
      partner: {
        profiles: counts.partnerProfiles, pending: counts.partnerPending,
        approved: counts.partnerApproved, newProfiles30d: counts.partnerNew30d,
        activeLinks: counts.activePartnerLinks, visits30d: counts.partnerVisits30d,
        confirmedSales30d: counts.confirmedPartnerSales30d,
      },
      store: { catalogProducts: counts.catalogProducts, retailCheckoutApproved: counts.retailCheckoutApproved },
    };
  });
