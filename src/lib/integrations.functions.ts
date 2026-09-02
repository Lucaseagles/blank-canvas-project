import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const credentialInput = z.object({ platformId: z.string().min(1), fieldKey: z.string().min(1), value: z.string().min(1) });

export const saveIntegrationSecret = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data) => credentialInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: secretId, error } = await supabaseAdmin.rpc("set_integration_secret", {
      p_platform_id: data.platformId,
      p_field_key: data.fieldKey,
      p_value: data.value,
    });
    if (error) throw new Error(`Não foi possível salvar a credencial: ${error.message}`);
    return { success: true, secretId: secretId as string };
  });

export const getIntegrationStatuses = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("integration_credentials")
      .select("platform_id, status, last_checked_at, last_error, created_at, updated_at")
      .order("platform_id");
    if (error) throw new Error(`Não foi possível carregar as integrações: ${error.message}`);
    return data ?? [];
  });

export const testIntegration = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data) => z.object({ platformId: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { createConnector } = await import("@/integrations/connectors");
    const connector = createConnector(data.platformId);
    if (!connector) throw new Error(`Connector não implementado: ${data.platformId}`);
    const result = await connector.testConnection();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("mark_integration_check", {
      p_platform_id: data.platformId,
      p_status: result.success ? "active" : "error",
      p_error: result.success ? null : (result.message ?? result.error ?? "Falha na conexão"),
    });
    if (error) console.error("Failed to persist integration test status", error);
    return result;
  });
