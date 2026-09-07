import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const marketplaceInput = z.object({ marketplaceId: z.string().uuid() });

/** Stores marketplace integration configuration server-side. Never expose credentials to the client. */
export const updateMarketplaceCredentials = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => z.object({ marketplaceId: z.string().uuid(), credentials: z.record(z.unknown()) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("marketplaces").update({ api_config: data.credentials, status: "pending", api_status: "pending", updated_at: new Date().toISOString() }).eq("id", data.marketplaceId);
    if (error) throw new Error(`Não foi possível salvar as credenciais: ${error.message}`);
    return { success: true };
  });

/**
 * Does not claim a marketplace sync succeeded when there is no provider-specific connector.
 * Provider APIs must be implemented and configured before products can be imported automatically.
 */
export const syncMarketplace = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data) => marketplaceInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: marketplace, error } = await supabaseAdmin.from("marketplaces").select("id,name,slug,api_config").eq("id", data.marketplaceId).single();
    if (error) throw new Error(`Não foi possível carregar o marketplace: ${error.message}`);
    if (!marketplace?.api_config) {
      await supabaseAdmin.from("marketplaces").update({ api_status: "not_configured", updated_at: new Date().toISOString() }).eq("id", data.marketplaceId);
      return { success: false, syncedCount: 0, message: `${marketplace.name}: API não configurada. O cadastro manual de produtos continua disponível.` };
    }
    await supabaseAdmin.from("marketplaces").update({ api_status: "connector_not_implemented", updated_at: new Date().toISOString() }).eq("id", data.marketplaceId);
    return { success: false, syncedCount: 0, message: `${marketplace.name}: credenciais encontradas, mas o conector específico ainda não está implementado. Nenhum produto foi alterado.` };
  });
