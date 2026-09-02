import { BaseConnector, ConnectorResult, ConnectorStatus } from "./BaseConnector";

export class AliExpressConnector extends BaseConnector {
  constructor() { super("aliexpress"); }

  async checkStatus(): Promise<ConnectorStatus> {
    const configured = await this.isConfigured();
    return { isActive: false, isConfigured: configured, lastCheck: new Date().toISOString(), error: configured ? "Validação ao vivo depende da API/credenciais habilitadas para a conta AliExpress." : "Credenciais não configuradas" };
  }

  async testConnection(): Promise<ConnectorResult> {
    return (await this.isConfigured())
      ? { success: false, message: "Credenciais salvas. A chamada de validação será habilitada quando o endpoint/API da conta estiver disponível." }
      : { success: false, message: "Credenciais não configuradas" };
  }

  async send(): Promise<ConnectorResult> { return { success: false, error: "AliExpress não possui operação genérica de envio nesta camada." }; }
}
