import { useCallback, useEffect, useMemo, useState } from "react";
import { loadIntegrationStatuses, saveCredential, testConnection } from "../services/integrationService";
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

  const state: AdminIntegrationState = useMemo(() => {
    return loadIntegrationState(rows);
  }, [rows]);

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

  return {
    rows,
    statuses,
    state,
    activePlatforms,
    loading,
    refreshing,
    error,
    load,
    saveCredential: save,
    testConnection: test,
    isPlatformActive: useCallback((platformId: string) => activePlatforms.includes(platformId), [activePlatforms]),
    isCategoryActive: useCallback((category: string) => Object.entries(state.integrations).some(([id, active]) => active && id && category), [state.integrations]),
  };
}

function loadIntegrationState(rows: IntegrationDbStatus[]) {
  const active = new Set(rows.filter((row) => row.status === "active").map((row) => row.platform_id));
  const anyMarketplace = ["tiktok_shop", "shopee", "mercadolivre", "aliexpress", "amazon"].some((id) => active.has(id));
  return {
    integrations: Object.fromEntries(rows.map((row) => [row.platform_id, active.has(row.platform_id)])),
    sectors: {
      videos: active.has("tiktok_shop"),
      videoBridge: active.has("tiktok_shop"),
      products: anyMarketplace,
      marketplaces: anyMarketplace,
      notifications: active.has("whatsapp") || active.has("telegram"),
      offers: anyMarketplace,
      socialProof: anyMarketplace,
    },
  } as AdminIntegrationState;
}
