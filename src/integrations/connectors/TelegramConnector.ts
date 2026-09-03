import { BaseConnector, ConnectorResult, ConnectorStatus } from "./BaseConnector";

interface TelegramResponse<T = unknown> { ok: boolean; result?: T; description?: string; }

export class TelegramConnector extends BaseConnector {
  constructor() { super("telegram"); }

  private async api<T>(method: string, init?: RequestInit): Promise<TelegramResponse<T>> {
    await this.loadSecrets();
    const token = this.secrets["bot_token"];
    if (!token) return { ok: false, description: "Bot Token não configurado" };
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, init);
    return response.json() as Promise<TelegramResponse<T>>;
  }

  async checkStatus(): Promise<ConnectorStatus> {
    const lastCheck = new Date().toISOString();
    if (!(await this.isConfigured())) return { isActive: false, isConfigured: false, lastCheck, error: "Credenciais não configuradas" };
    const result = await this.api<{ username?: string }>("getMe");
    return { isActive: result.ok, isConfigured: true, lastCheck, error: result.ok ? null : result.description ?? "Falha no Telegram" };
  }

  async testConnection(): Promise<ConnectorResult> {
    if (!(await this.isConfigured())) return { success: false, message: "Credenciais não configuradas" };
    try {
      const result = await this.api<{ username?: string; first_name?: string }>("getMe");
      if (!result.ok) return { success: false, message: result.description ?? "Falha ao validar o bot" };
      return { success: true, message: `Bot conectado: @${result.result?.username ?? result.result?.first_name ?? "bot"}` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Erro de conexão" };
    }
  }

  async send(data: unknown): Promise<ConnectorResult> {
    await this.loadSecrets();
    const payload = data as { message?: string; chat_id?: string | number };
    const chatId = payload.chat_id ?? this.secrets["channel_id"];
    if (!chatId) return { success: false, error: "Channel ID não configurado" };
    if (!payload.message?.trim()) return { success: false, error: "Mensagem vazia" };
    try {
      const result = await this.api("sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: payload.message, parse_mode: "HTML" }),
      });
      return result.ok ? { success: true } : { success: false, error: result.description ?? "Erro ao enviar" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro de conexão" };
    }
  }
}
