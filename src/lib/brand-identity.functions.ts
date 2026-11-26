import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const DEFAULT_BRAND_NAME = "Hub Eagles";

export const getPublicBrandIdentity = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).from("brand_identity").select("display_name").eq("id", true).maybeSingle();
  if (error) throw error;
  return { displayName: String(data?.display_name ?? DEFAULT_BRAND_NAME) };
});

export const updateBrandIdentity = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((input: unknown) => z.object({
    displayName: z.string().trim().min(2).max(80),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await (supabaseAdmin as any).rpc("rubi_update_brand_identity_audited", {
      p_display_name: data.displayName,
      p_actor: context.userId,
    });
    if (error) throw error;
    const row = Array.isArray(updated) ? updated[0] : updated;
    if (!row?.display_name) throw new Error("A identidade da marca não foi confirmada.");
    return { displayName: String(row.display_name) };
  });
