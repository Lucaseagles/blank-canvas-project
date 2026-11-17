import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const marketplaceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(["active", "pending", "disabled"]),
  affiliate_link_structure: z.string().trim().max(2000).optional().nullable(),
});

function validateAffiliateStructure(value: string | null | undefined) {
  if (!value) return;
  let url: URL;
  try { url = new URL(value.replace(/\\{[^{}]+\\}/g, "sample")); }
  catch { throw new Error("Informe uma estrutura de afiliado com URL HTTPS válida."); }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new Error("A estrutura de afiliado deve usar HTTPS e não pode conter credenciais.");
  }
}

export const listAdminMarketplaces = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("marketplaces")
      .select("id,name,slug,status,api_status,created_at,updated_at,affiliate_link_structure")
      .order("name");
    if (error) throw error;
    return data ?? [];
  });

export const getAdminMarketplace = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("marketplaces")
      .select("id,name,slug,status,api_status,created_at,updated_at,affiliate_link_structure")
      .eq("id", data.id).maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Marketplace não encontrado.");
    return row;
  });

export const saveAdminMarketplace = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => marketplaceSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    validateAffiliateStructure(data.affiliate_link_structure);
    const { data: result, error } = await supabaseAdmin.rpc("rubi_manage_marketplace_audited", {
      p_action: "save",
      p_id: data.id ?? null,
      p_payload: {
        name: data.name,
        slug: data.slug,
        status: data.status,
        affiliate_link_structure: data.affiliate_link_structure || null,
      },
      p_actor: context.userId,
    });
    if (error) throw new Error(`Não foi possível salvar o marketplace: ${error.message}`);
    return { success: true, id: result?.id as string };
  });

export const deleteAdminMarketplace = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("rubi_manage_marketplace_audited", {
      p_action: "delete",
      p_id: data.id,
      p_payload: {},
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message.includes("linked products")
      ? "Não é possível excluir: existem produtos vinculados. Desative o marketplace ou reatribua os produtos antes."
      : `Não foi possível excluir o marketplace: ${error.message}`);
    return { success: true };
  });
