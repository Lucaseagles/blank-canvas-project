import type { AdminIntegrationState, IntegrationDbStatus } from "../core/database";
import { deriveAdminIntegrationState, indexIntegrationStatuses } from "../core/database";
import { PLATFORMS } from "../config/platforms";
import { getIntegrationStatuses, saveIntegrationSecret, testIntegration } from "@/lib/integrations.functions";

export async function loadIntegrationStatuses() {
  const rows = (await getIntegrationStatuses({ data: undefined })) as IntegrationDbStatus[];
  return { rows, byPlatform: indexIntegrationStatuses(rows), state: deriveAdminIntegrationState(rows, Object.values(PLATFORMS)) };
}

export async function saveCredential(platformId: string, fieldKey: string, value: string) {
  return saveIntegrationSecret({ data: { platformId, fieldKey, value } });
}

export async function testConnection(platformId: string) {
  return testIntegration({ data: { platformId } });
}

export function getIntegrationState(rows: IntegrationDbStatus[]): AdminIntegrationState {
  return deriveAdminIntegrationState(rows, Object.values(PLATFORMS));
}
