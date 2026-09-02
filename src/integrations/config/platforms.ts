import type {
  CredentialField,
  PlatformCapabilities,
  PlatformConfig,
  PlatformRules,
  AffiliateRules,
  ContentRules,
} from "../core/types";

export type IntegrationStatus = "pending" | "active" | "error";
export type { CredentialField, PlatformConfig, PlatformCapabilities, PlatformRules, AffiliateRules, ContentRules };

const NO_PRODUCT: PlatformCapabilities = {
  hasProductCatalog: false, hasProductAPI: false, hasProductSearch: false,
  hasAffiliateProgram: false, hasAffiliateAPI: false, hasAffiliateLinks: false, hasCommissionTracking: false,
  hasVideoContent: false, hasVideoAPI: false, canEmbedVideo: false, canLinkVideoToProduct: false,
  requiresContentAuthorization: false, allowsExternalLinks: false, allowsExternalTraffic: false,
  requiresOptIn: false, requiresTemplateApproval: false, hasContentRestrictions: false,
};

const BASIC_CONTENT: ContentRules = {
  canEmbed: false, canDownload: false, canEdit: false, canRemoveWatermark: false,
  canHost: false, requiresAttribution: false,
};

const MARKETPLACE_AFFILIATE: PlatformCapabilities = {
  ...NO_PRODUCT,
  hasProductCatalog: true, hasProductAPI: true, hasProductSearch: true,
  hasAffiliateProgram: true, hasAffiliateAPI: true, hasAffiliateLinks: true, hasCommissionTracking: true,
  allowsExternalLinks: true, allowsExternalTraffic: true, hasContentRestrictions: true,
};

const TIKTOK_CAPABILITIES: PlatformCapabilities = {
  ...MARKETPLACE_AFFILIATE,
  hasVideoContent: true, hasVideoAPI: true, canEmbedVideo: true, canLinkVideoToProduct: true,
  requiresContentAuthorization: true,
};

const KWAI_CAPABILITIES: PlatformCapabilities = {
  ...NO_PRODUCT,
  hasProductCatalog: true, hasProductSearch: true, hasVideoContent: true, hasVideoAPI: true,
  canEmbedVideo: true, requiresContentAuthorization: true, requiresOptIn: true, hasContentRestrictions: true,
};

const WHATSAPP_CAPABILITIES: PlatformCapabilities = {
  ...NO_PRODUCT,
  allowsExternalLinks: true, allowsExternalTraffic: true, requiresOptIn: true,
  requiresTemplateApproval: true, hasContentRestrictions: true,
};

const TELEGRAM_CAPABILITIES: PlatformCapabilities = {
  ...NO_PRODUCT, allowsExternalLinks: true, allowsExternalTraffic: true,
};

const MARKETPLACE_RULES: PlatformRules = {
  allowedActions: ["share_affiliate_links", "product_discovery", "product_search"],
  restrictedActions: ["auto_purchase", "auto_checkout"],
  requiresReview: ["bulk_operations"],
  blockedActions: ["spam", "fraudulent_activity"],
  ruleComments: { share_affiliate_links: "Use somente links oficiais do programa." },
};

const AFFILIATE_RULES: AffiliateRules = {
  canShareLinks: true, canTrackConversions: true, requiresApproval: false,
  commissionStructure: "dynamic", payoutPeriod: "monthly", restrictions: ["Respeitar as regras do programa de afiliados."],
};

export const TIKTOK_SHOP_CONFIG: PlatformConfig = {
  id: "tiktok_shop", name: "TikTok Shop", icon: "🎵", color: "#000000",
  description: "Produtos, afiliados e vídeo commerce; tráfego externo depende do programa aplicável.", category: "marketplace",
  capabilities: TIKTOK_CAPABILITIES, status: "external_traffic",
  credentialFields: [
    { key: "partner_id", label: "Partner ID", type: "text", placeholder: "partner_123", required: true },
    { key: "affiliate_id", label: "Affiliate ID", type: "text", placeholder: "aff_123", required: true },
  ],
  docsUrl: "https://developers.tiktok.com/", setupGuide: "Configure somente credenciais e programas oficialmente disponíveis para sua conta/região.",
  rules: { ...MARKETPLACE_RULES, allowedActions: ["share_affiliate_link_external", "embed_video", "link_product_to_video"], restrictedActions: ["download_video", "reupload_video", "remove_watermark", "edit_video"], blockedActions: ["video_repurposing", "content_theft"] },
  affiliateRules: { ...AFFILIATE_RULES, restrictions: ["Use links oficiais do TikTok Shop e observe o programa de tráfego externo aplicável."] },
  contentRules: { ...BASIC_CONTENT, canEmbed: true, requiresAttribution: true, attributionText: "Conteúdo original do TikTok" },
};

export const SHOPEE_CONFIG: PlatformConfig = {
  id: "shopee", name: "Shopee", icon: "S", color: "#EE4D2D", description: "Marketplace com programa de afiliados.", category: "marketplace",
  capabilities: MARKETPLACE_AFFILIATE, status: "available", connectorId: "shopee",
  credentialFields: [
    { key: "partner_id", label: "Partner ID", type: "text", required: true },
    { key: "partner_key", label: "Partner Key", type: "password", required: true },
    { key: "affiliate_id", label: "Affiliate ID", type: "text", required: true },
  ], docsUrl: "https://open.shopee.com/", setupGuide: "Cadastre a aplicação/programa correspondente e informe as credenciais oficiais.",
  rules: MARKETPLACE_RULES, affiliateRules: AFFILIATE_RULES, contentRules: BASIC_CONTENT,
};

export const KWAI_CONFIG: PlatformConfig = {
  id: "kwai", name: "Kwai / Kwai Shop", icon: "📱", color: "#FF6900", description: "Vídeo e recursos de Shop sujeitos à disponibilidade e elegibilidade.", category: "video",
  capabilities: KWAI_CAPABILITIES, status: "pending",
  credentialFields: [{ key: "api_key", label: "API Key", type: "password", required: false, placeholder: "kwai_...", helpText: "Use somente credenciais fornecidas oficialmente." }],
  docsUrl: "https://www.kwai.com/", setupGuide: "A disponibilidade de Shop/API pode depender de convite, conta, região e programa vigente.",
  rules: { allowedActions: ["video_discovery", "content_embedding"], restrictedActions: ["shop_integration", "affiliate_links"], requiresReview: ["shop_operations"], blockedActions: ["video_download", "video_repurposing"], ruleComments: {} },
  affiliateRules: { canShareLinks: false, canTrackConversions: false, requiresApproval: true, commissionStructure: "dynamic", payoutPeriod: "pending", restrictions: ["Programa de afiliados deve ser validado antes do uso."] },
  contentRules: { ...BASIC_CONTENT, canEmbed: true, requiresAttribution: true, attributionText: "Conteúdo original do Kwai" },
};

export const MERCADO_LIVRE_CONFIG: PlatformConfig = {
  id: "mercadolivre", name: "Mercado Livre", icon: "ML", color: "#FFE600", description: "Produtos e recursos de afiliados via APIs/programas oficiais.", category: "marketplace",
  capabilities: MARKETPLACE_AFFILIATE, status: "available", connectorId: "mercadolivre",
  credentialFields: [
    { key: "client_id", label: "Client ID", type: "text", required: true },
    { key: "client_secret", label: "Client Secret", type: "password", required: true },
    { key: "affiliate_id", label: "Affiliate ID", type: "text", required: true },
  ], docsUrl: "https://developers.mercadolivre.com.br/", setupGuide: "Crie o aplicativo no Mercado Livre Developers e configure OAuth/programa de afiliados conforme elegibilidade.",
  rules: MARKETPLACE_RULES, affiliateRules: AFFILIATE_RULES, contentRules: BASIC_CONTENT,
};

export const ALIEXPRESS_CONFIG: PlatformConfig = {
  id: "aliexpress", name: "AliExpress", icon: "A", color: "#FF4747", description: "Produtos e afiliados via programas e APIs oficiais.", category: "marketplace",
  capabilities: MARKETPLACE_AFFILIATE, status: "available", connectorId: "aliexpress",
  credentialFields: [
    { key: "app_key", label: "App Key", type: "text", required: true },
    { key: "app_secret", label: "App Secret", type: "password", required: true },
    { key: "tracking_id", label: "Tracking ID", type: "text", required: true },
  ], docsUrl: "https://portals.aliexpress.com/", setupGuide: "Cadastre a aplicação/programa e informe as credenciais oficiais.",
  rules: MARKETPLACE_RULES, affiliateRules: AFFILIATE_RULES, contentRules: BASIC_CONTENT,
};

export const AMAZON_CONFIG: PlatformConfig = {
  id: "amazon", name: "Amazon", icon: "A", color: "#FF9900", description: "Produtos via Amazon Associates/Product Advertising API.", category: "marketplace",
  capabilities: MARKETPLACE_AFFILIATE, status: "available",
  credentialFields: [
    { key: "access_key", label: "Access Key", type: "text", required: true },
    { key: "secret_key", label: "Secret Key", type: "password", required: true },
    { key: "associate_id", label: "Associate ID", type: "text", required: true },
  ], docsUrl: "https://affiliate-program.amazon.com/", setupGuide: "Configure Amazon Associates e a API elegível para sua conta/região.",
  rules: MARKETPLACE_RULES, affiliateRules: AFFILIATE_RULES, contentRules: BASIC_CONTENT,
};

export const WHATSAPP_CONFIG: PlatformConfig = {
  id: "whatsapp", name: "WhatsApp Business", icon: "◉", color: "#25D366", description: "WhatsApp Business Cloud API para comunicação com opt-in.", category: "communication",
  capabilities: WHATSAPP_CAPABILITIES, status: "available", connectorId: "whatsapp",
  credentialFields: [
    { key: "business_account_id", label: "Business Account ID", type: "text", required: true },
    { key: "phone_number_id", label: "Phone Number ID", type: "text", required: true },
    { key: "access_token", label: "Access Token", type: "password", required: true },
  ], docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api", setupGuide: "Configure no Meta Business e use templates/regras de mensageria aplicáveis.",
  rules: { allowedActions: ["send_templates", "send_messages", "opt_in"], restrictedActions: ["send_free_text_first_message"], requiresReview: ["custom_templates"], blockedActions: ["spam", "unsolicited_messages"], ruleComments: {} },
  affiliateRules: { canShareLinks: true, canTrackConversions: false, requiresApproval: true, commissionStructure: "dynamic", payoutPeriod: "pending", restrictions: ["Comunicações promocionais dependem de opt-in e políticas aplicáveis."] }, contentRules: BASIC_CONTENT,
};

export const TELEGRAM_CONFIG: PlatformConfig = {
  id: "telegram", name: "Telegram", icon: "✈", color: "#26A5E4", description: "Envio de ofertas e notificações via Telegram Bot.", category: "communication",
  capabilities: TELEGRAM_CAPABILITIES, status: "available", connectorId: "telegram",
  credentialFields: [
    { key: "bot_token", label: "Bot Token", type: "password", placeholder: "123456789:AA...", required: true, helpText: "Nunca exponha o token no navegador." },
    { key: "channel_id", label: "Channel ID", type: "text", placeholder: "@meucanal ou -100...", required: false },
  ], docsUrl: "https://core.telegram.org/bots/api", setupGuide: "Crie um bot com @BotFather e informe o token.",
  rules: { allowedActions: ["send_messages", "send_links", "send_media"], restrictedActions: ["spam"], requiresReview: [], blockedActions: ["flood", "harassment"], ruleComments: {} },
  affiliateRules: { canShareLinks: true, canTrackConversions: false, requiresApproval: false, commissionStructure: "dynamic", payoutPeriod: "pending", restrictions: ["Respeitar regras do canal e do programa de afiliados utilizado."] }, contentRules: BASIC_CONTENT,
};

export const ALL_PLATFORMS: Record<string, PlatformConfig> = {
  tiktok_shop: TIKTOK_SHOP_CONFIG, shopee: SHOPEE_CONFIG, kwai: KWAI_CONFIG,
  mercadolivre: MERCADO_LIVRE_CONFIG, aliexpress: ALIEXPRESS_CONFIG, amazon: AMAZON_CONFIG,
  whatsapp: WHATSAPP_CONFIG, telegram: TELEGRAM_CONFIG,
};

/** Backward-compatible alias for existing integration code. */
export const PLATFORMS = ALL_PLATFORMS;

export const PLATFORMS_BY_CATEGORY: Record<PlatformConfig["category"], PlatformConfig[]> = {
  marketplace: [TIKTOK_SHOP_CONFIG, SHOPEE_CONFIG, MERCADO_LIVRE_CONFIG, ALIEXPRESS_CONFIG, AMAZON_CONFIG],
  affiliate: [TIKTOK_SHOP_CONFIG, SHOPEE_CONFIG, MERCADO_LIVRE_CONFIG, ALIEXPRESS_CONFIG, AMAZON_CONFIG],
  video: [TIKTOK_SHOP_CONFIG, KWAI_CONFIG],
  communication: [TELEGRAM_CONFIG, WHATSAPP_CONFIG],
  compliance: [],
};

export const PLATFORM_LIST = Object.values(ALL_PLATFORMS);
