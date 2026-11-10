import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "./auth-guards.server";

type Metrics = {
  quoteRequests: number;
  requestingMerchants: number;
  respondedRequests: number;
  merchantsWithResponse: number;
  pendingRequests: number;
  replenishmentRequests: number;
  replenishingMerchants: number;
  repeatRequestMerchants: number;
};

/** Counts commercial interest, not completed orders, repeat purchases, or revenue. */
export const getRubiBusinessRetentionAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .rpc("rubi_business_retention_funnel", { p_days: 30 });
    if (error) throw error;
    const row = (data ?? [])[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error("Relatório comercial indisponível.");
    const read = (field: string): number => {
      const n = Number(row[field]);
      if (!Number.isSafeInteger(n) || n < 0) throw new Error("Métrica comercial inválida.");
      return n;
    };
    const metrics: Metrics = {
      quoteRequests: read("quote_requests"),
      requestingMerchants: read("requesting_merchants"),
      respondedRequests: read("responded_requests"),
      merchantsWithResponse: read("merchants_with_response"),
      pendingRequests: read("pending_requests"),
      replenishmentRequests: read("replenishment_requests"),
      replenishingMerchants: read("replenishing_merchants"),
      repeatRequestMerchants: read("repeat_request_merchants"),
    };
    return { days: 30, asOf: new Date().toISOString(), ...metrics };
  });
