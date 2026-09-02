export type IntegrationStatus = "pending" | "active" | "error";
export type CredentialFieldType = "text" | "password" | "select" | "textarea";

export interface CredentialField {
  key: string;
  label: string;
  type: CredentialFieldType;
  placeholder?: string;
  required: boolean;
  options?: { label: string; value: string }[];
  helpText?: string;
}

export interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  docsUrl: string;
  setupGuide: string;
  credentialFields: CredentialField[];
  connector: "telegram" | "whatsapp" | "shopee" | "mercadolivre" | "aliexpress";
}

export const PLATFORMS: Record<string, PlatformConfig> = {
  telegram: {
    id: "telegram", name: "Telegram", icon: "✈", color: "#26A5E4",
    description: "Envio de ofertas e notificações via Telegram Bot",
    docsUrl: "https://core.telegram.org/bots/api",
    setupGuide: "Crie um bot com @BotFather e informe o token do bot.", connector: "telegram",
    credentialFields: [
      { key: "bot_token", label: "Bot Token", type: "password", placeholder: "123456789:AA...", required: true, helpText: "Nunca exponha o token no navegador." },
      { key: "channel_id", label: "Channel ID", type: "text", placeholder: "@meucanal ou -100...", required: false, helpText: "Canal ou grupo de destino." },
    ],
  },
  whatsapp: {
    id: "whatsapp", name: "WhatsApp Business", icon: "◉", color: "#25D366",
    description: "WhatsApp Business Cloud API",
    docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    setupGuide: "Configure o número no Meta Business e gere um token de acesso.", connector: "whatsapp",
    credentialFields: [
      { key: "business_account_id", label: "Business Account ID", type: "text", required: true },
      { key: "phone_number_id", label: "Phone Number ID", type: "text", required: true },
      { key: "access_token", label: "Access Token", type: "password", required: true },
    ],
  },
  shopee: {
    id: "shopee", name: "Shopee", icon: "S", color: "#EE4D2D",
    description: "Integração com Shopee Affiliate/Open Platform",
    docsUrl: "https://open.shopee.com/", setupGuide: "Cadastre a aplicação e informe as credenciais fornecidas pela plataforma.", connector: "shopee",
    credentialFields: [
      { key: "partner_id", label: "Partner ID", type: "text", required: true },
      { key: "partner_key", label: "Partner Key", type: "password", required: true },
      { key: "affiliate_id", label: "Affiliate ID", type: "text", required: true },
    ],
  },
  mercadolivre: {
    id: "mercadolivre", name: "Mercado Livre", icon: "ML", color: "#FFE600",
    description: "OAuth e recursos de afiliados do Mercado Livre",
    docsUrl: "https://developers.mercadolivre.com.br/", setupGuide: "Crie o aplicativo no Mercado Livre Developers e configure OAuth.", connector: "mercadolivre",
    credentialFields: [
      { key: "client_id", label: "Client ID", type: "text", required: true },
      { key: "client_secret", label: "Client Secret", type: "password", required: true },
      { key: "affiliate_id", label: "Affiliate ID", type: "text", required: true },
    ],
  },
  aliexpress: {
    id: "aliexpress", name: "AliExpress", icon: "A", color: "#FF4747",
    description: "Integração com AliExpress Affiliate/Open Platform",
    docsUrl: "https://portals.aliexpress.com/", setupGuide: "Cadastre a aplicação e informe App Key, App Secret e Tracking ID.", connector: "aliexpress",
    credentialFields: [
      { key: "app_key", label: "App Key", type: "text", required: true },
      { key: "app_secret", label: "App Secret", type: "password", required: true },
      { key: "tracking_id", label: "Tracking ID", type: "text", required: true },
    ],
  },
};

export const PLATFORM_LIST = Object.values(PLATFORMS);
