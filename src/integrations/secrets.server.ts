import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getIntegrationSecretServer(platformId: string, fieldKey: string): Promise<string | null> {
  const db = supabaseAdmin as any;
  const { data, error } = await db.rpc("get_integration_secret", {
    p_platform_id: platformId,
    p_field_key: fieldKey,
  });
  if (error) throw new Error(`Não foi possível carregar o secret de ${platformId}: ${error.message}`);
  return (data as string | null) ?? null;
}
