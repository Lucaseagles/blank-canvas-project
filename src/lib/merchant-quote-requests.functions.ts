import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const submitMerchantQuoteRequest = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({
    accessToken: z.string().min(1),
    lines: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive().max(10000000) })).min(1).max(30),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: claims, error: authError } = await supabase.auth.getClaims(data.accessToken);
    const userId = claims?.claims?.sub;
    if (authError || !userId) throw new Error("Faça login novamente para solicitar orçamento.");
    if (new Set(data.lines.map(line => line.product_id)).size !== data.lines.length) throw new Error("Produtos duplicados na solicitação.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await (supabaseAdmin as any).from("commercial_profiles")
      .select("id").eq("user_id", userId).eq("audience", "merchant").eq("status", "approved").maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new Error("Apenas lojistas aprovados podem solicitar orçamentos.");
    const { data: quoteId, error } = await (supabaseAdmin as any).rpc("hub_create_merchant_quote", {
      p_profile_id: profile.id,
      p_lines: data.lines,
    });
    if (error) throw new Error("Não foi possível registrar a solicitação. Confira disponibilidade e quantidades e tente novamente.");
    return { id: String(quoteId) };
  });
