import { BaseConnector, ConnectorResult, ConnectorStatus } from "./BaseConnector";

export class MercadoLivreConnector extends BaseConnector {
  constructor() { super("mercadolivre"); }

  async checkStatus(): Promise<ConnectorStatus> {
    const configured = await this.isConfigured();
    return { isActive: false, isConfigured: configured, lastCheck: new Date().toISOString(), error: configured ? "Mercado Livre usa OAuth; o teste ao vivo será feito após autorização do aplicativo." : "Credenciais não configuradas" };
  }

  async testConnection(): Promise<ConnectorResult> {
    return (await this.isConfigured())
      ? { success: false, message: "Credenciais salvas. Autorize o aplicativo via OAuth do Mercado Livre para validar a conexão." }
      : { success: false, message: "Credenciais não configuradas" };
  }

  async send(): Promise<ConnectorResult> { return { success: false, error: "Mercado Livre não possui operação genérica de envio nesta camada." }; }
}
