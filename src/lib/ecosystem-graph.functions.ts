import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "./auth-guards.server";

export type EcosystemNode = { id: string; label: string; count: number; description: string };
export type EcosystemGraph = {
  nodes: EcosystemNode[];
  edges: Array<{ from: string; to: string; label: string; count: number }>;
  totals: { nodes: number; relations: number };
};

export const getEcosystemGraph = createServerFn({ method: "GET" })
  .middleware([requireOwnerRole])
  .handler(async (): Promise<EcosystemGraph> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const definitions = [
      ["users", "Usuários", "profiles", "Usuários registrados"],
      ["products", "Produtos", "products", "Catálogo e ofertas"],
      ["collections", "Coleções", "curated_collections", "Coleções inteligentes"],
      ["campaigns", "Campanhas", "campaigns", "Campanhas de distribuição"],
      ["channels", "Canais", "social_channels", "Canais sociais configurados"],
      ["strategies", "Estratégias", "social_channel_strategies", "Estratégias por canal"],
      ["segments", "Segmentos", "user_segments", "Segmentação comportamental"],
      ["referrals", "Indicações", "referral_events", "Eventos de indicação"],
    ] as const;

    const results = await Promise.all(definitions.map(async ([id, label, table, description]) => {
      const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
      if (error) throw new Error(`${table}: ${error.message}`);
      return { id, label, count: count ?? 0, description };
    }));

    const relationDefinitions = [
      ["products", "collections", "itens em coleções", "collection_items"],
      ["campaigns", "products", "produtos em campanhas", "campaign_products"],
      ["campaigns", "channels", "canais de campanha", "campaign_channels"],
      ["channels", "strategies", "estratégias por canal", "social_channel_strategies"],
    ] as const;
    const relations = await Promise.all(relationDefinitions.map(async ([from, to, label, table]) => {
      const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
      if (error) throw new Error(`${table}: ${error.message}`);
      return { from, to, label, count: count ?? 0 };
    }));

    return { nodes: results, edges: relations, totals: { nodes: results.length, relations: relations.length } };
  });
