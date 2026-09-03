import { BaseConnector, ConnectorResult, ConnectorStatus } from "./BaseConnector";

interface GraphResponse { error?: { message?: string }; display_phone_number?: string; id?: string; }

export class WhatsAppConnector extends BaseConnector {
  constructor() { super("whatsapp"); }

  private async request(path: string, init?: RequestInit): Promise<GraphResponse> {
    await this.loadSecrets();
    const token = this.secrets["access_token"];
    if (!token) return { error: { message: "Access Token não configurado" } };
    const response = await fetch(`https://graph.facebook.com/v23.0/${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    });
    return response.json() as Promise<GraphResponse>;
  }

  async checkStatus(): Promise<ConnectorStatus> {
    const lastCheck = new Date().toISOString();
    if (!(await this.isConfigured())) return { isActive: false, isConfigured: false, lastCheck, error: "Credenciais não configuradas" };
    const phoneNumberId = this.secrets["phone_number_id"];
    if (!phoneNumberId) return { isActive: false, isConfigured: false, lastCheck, error: "Phone Number ID não configurado" };
    const result = await this.request(phoneNumberId);
    return { isActive: !result.error, isConfigured: true, lastCheck, error: result.error?.message ?? null };
  }

  async testConnection(): Promise<ConnectorResult> {
    if (!(await this.isConfigured())) return { success: false, message: "Credenciais não configuradas" };
    const phoneNumberId = this.secrets["phone_number_id"];
    if (!phoneNumberId) return { success: false, message: "Phone Number ID não configurado" };
    try {
      const result = await this.request(phoneNumberId);
      if (result.error) return { success: false, message: result.error.message ?? "Falha ao validar o WhatsApp" };
      return { success: true, message: `WhatsApp conectado: ${result.display_phone_number ?? "número validado"}` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Erro de conexão" };
    }
  }

  async send(data: unknown): Promise<ConnectorResult> {
    await this.loadSecrets();
    const phoneNumberId = this.secrets["phone_number_id"];
    if (!phoneNumberId) return { success: false, error: "Phone Number ID não configurado" };
    const payload = data as { to?: string; message?: string; template?: { name: string; language?: string; components?: unknown[] } };
    if (!payload.to || (!payload.message && !payload.template)) return { success: false, error: "Destinatário e mensagem/template são obrigatórios" };
    const body = payload.template
      ? { messaging_product: "whatsapp", to: payload.to, type: "template", template: { name: payload.template.name, language: { code: payload.template.language ?? "pt_BR" }, components: payload.template.components ?? [] } }
      : { messaging_product: "whatsapp", to: payload.to, type: "text", text: { body: payload.message } };
    try {
      const result = await this.request(`${phoneNumberId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      return result.error ? { success: false, error: result.error.message ?? "Erro ao enviar" } : { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro de conexão" };
    }
  }
}
