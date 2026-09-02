import { useCallback, useEffect, useMemo, useState } from "react";
import { loadIntegrationStatuses, saveCredential, testConnection } from "../services/integrationService";
import { PLATFORM_LIST } from "../config/platforms";
import type { AdminIntegrationState, IntegrationDbStatus } from "../core/database";

export function useIntegrations() {
  const [rows, setRows] = useState<IntegrationDbStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const result = await loadIntegrationStatuses();
      setRows(result.rows);
      return result;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Falha ao carregar integrações.";
      setError(message);
      throw cause;
    } finally {
      if (background) setRefreshing(false); else setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const state = useMemo(() => loadIntegrationState(rows), [rows]);
  const statuses = useMemo(() => Object.fromEntries(rows.map((row) => [row.platform_id, row])), [rows]);
  const activePlatforms = useMemo(() => rows.filter((row) => row.status === "active").map((row) => row.platform_id), [rows]);

  const save = useCallback(async (platformId: string, fieldKey: string, value: string) => {
    await saveCredential(platformId, fieldKey, value);
    await load(true);
  }, [load]);

  const test = useCallback(async (platformId: string) => {
    const result = await testConnection(platformId);
    await load(true);
    return result;
  }, [load]);

  const isPlatformActive = useCallback((platformId: string) => activePlatforms.includes(platformId), [activePlatforms]);
  const isCategoryActive = useCallback((category: string) => {
    const active = new Set(activePlatforms);
    return PLATFORM_LIST.some((platform) => platform.category === category && active.has(platform.id));
  }, [activePlatforms]);

  return { rows, statuses, state, activePlatforms, loading, refreshing, error, load, saveCredential: save, testConnection: test, isPlatformActive, isCategoryActive };
}

function loadIntegrationState(rows: IntegrationDbStatus[]): AdminIntegrationState {
  return {
    integrations: Object.fromEntries(PLATFORM_LIST.map((platform) => [platform.id, rows.some((row) => row.platform_id === platform.id && row.status === "active")])),
    sectors: deriveSectors(rows),
  };
}

function deriveSectors(rows: IntegrationDbStatus[]) {
  const active = new Set(rows.filter((row) => row.status === "active").map((row) => row.platform_id));
  const marketplaceIds = PLATFORM_LIST.filter((platform) => platform.category === "marketplace").map((platform) => platform.id);
  const anyMarketplace = marketplaceIds.some((id) => active.has(id));
  return {
    videos: active.has("tiktok_shop"),
    videoBridge: active.has("tiktok_shop"),
    products: anyMarketplace,
    marketplaces: anyMarketplace,
    notifications: active.has("whatsapp") || active.has("telegram"),
    offers: anyMarketplace,
    socialProof: anyMarketplace,
  };
}
