import { BaseConnector, ConnectorResult, ConnectorStatus } from "./BaseConnector";

export class ShopeeConnector extends BaseConnector {
  constructor() { super("shopee"); }

  async checkStatus(): Promise<ConnectorStatus> {
    const configured = await this.isConfigured();
    return { isActive: false, isConfigured: configured, lastCheck: new Date().toISOString(), error: configured ? "Validação da API Shopee depende das credenciais/parâmetros oficiais da conta" : "Credenciais não configuradas" };
  }

  async testConnection(): Promise<ConnectorResult> {
    return (await this.isConfigured())
      ? { success: false, message: "Credenciais salvas. O fluxo de assinatura/API Shopee ainda requer os parâmetros oficiais da conta antes do teste ao vivo." }
      : { success: false, message: "Credenciais não configuradas" };
  }

  async send(): Promise<ConnectorResult> { return { success: false, error: "Shopee não possui operação genérica de envio nesta camada." }; }
}
