import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PLATFORMS } from "@/integrations/config/platforms";
import { requireOwnerRole } from "./auth-guards.server";

const credentialInput = z.object({ platformId: z.string().min(1), fieldKey: z.string().min(1), value: z.string().min(1) });
const platformInput = z.object({ platformId: z.string().min(1) });

function assertPlatformCredential(platformId: string, fieldKey: string) {
  const platform = PLATFORMS[platformId];
  if (!platform) throw new Error("Integração não registrada.");
  if (!platform.credentialFields.some((field) => field.key === fieldKey)) throw new Error("Campo de credencial não registrado para esta integração.");
}

export const saveIntegrationSecret = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data) => credentialInput.parse(data))
  .handler(async ({ data }) => {
    assertPlatformCredential(data.platformId, data.fieldKey);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { error } = await db.rpc("set_integration_secret", {
      p_platform_id: data.platformId,
      p_field_key: data.fieldKey,
      p_value: data.value,
    });
    if (error) throw new Error(`Não foi possível salvar a credencial: ${error.message}`);
    return { success: true };
  });

export const getIntegrationStatuses = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { data, error } = await db
      .from("integration_credentials")
      .select("platform_id, status, last_checked_at, last_error, created_at, updated_at")
      .order("platform_id");
    if (error) throw new Error(`Não foi possível carregar as integrações: ${error.message}`);
    return data ?? [];
  });

export const testIntegration = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data) => platformInput.parse(data))
  .handler(async ({ data }) => {
    const platform = PLATFORMS[data.platformId];
    if (!platform) throw new Error("Integração não registrada.");
    if (!platform.connectorId) throw new Error("Esta integração ainda está em fase de implementação; o teste ao vivo será habilitado quando o connector oficial estiver pronto.");
    const { createConnector } = await import("@/integrations/connectors");
    const connector = createConnector(data.platformId);
    if (!connector) throw new Error("Connector oficial não disponível para esta integração.");
    const result = await connector.testConnection();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { error } = await db.rpc("mark_integration_check", {
      p_platform_id: data.platformId,
      p_status: result.success ? "active" : "error",
      p_error: result.success ? null : (result.message ?? result.error ?? "Falha na conexão"),
    });
    if (error) console.error("Failed to persist integration test status", error);
    return result;
  });
