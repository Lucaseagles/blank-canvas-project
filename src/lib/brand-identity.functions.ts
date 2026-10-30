import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

export const DEFAULT_BRAND_NAME = "Rubi e Ragles";

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
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("brand_identity")
      .upsert({ id: true, display_name: data.displayName, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw error;
    return { displayName: data.displayName };
  });
