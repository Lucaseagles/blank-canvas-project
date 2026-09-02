import { PlatformConfig, PLATFORMS } from "../config/platforms";
import { getIntegrationSecretServer } from "../secrets.server";

export interface ConnectorStatus {
  isActive: boolean;
  isConfigured: boolean;
  lastCheck: string | null;
  error: string | null;
}

export interface ConnectorResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export abstract class BaseConnector {
  protected readonly platformId: string;
  protected readonly config: PlatformConfig;
  protected secrets: Record<string, string> = {};

  constructor(platformId: string) {
    const config = PLATFORMS[platformId];
    if (!config) throw new Error(`Plataforma ${platformId} não encontrada`);
    this.platformId = platformId;
    this.config = config;
  }

  protected async loadSecrets(): Promise<boolean> {
    this.secrets = {};
    for (const field of this.config.credentialFields) {
      const value = await getIntegrationSecretServer(this.platformId, field.key);
      if (value) this.secrets[field.key] = value;
    }
    return true;
  }

  async isConfigured(): Promise<boolean> {
    await this.loadSecrets();
    return this.config.credentialFields.every((field) => !field.required || Boolean(this.secrets[field.key]));
  }

  abstract checkStatus(): Promise<ConnectorStatus>;
  abstract testConnection(): Promise<ConnectorResult>;
  abstract send(data: unknown): Promise<ConnectorResult>;
}
