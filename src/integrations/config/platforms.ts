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

const MARKETPLACE_AFFILIATE: PlatformCapabilities = {
  ...NO_PRODUCT,
  hasProductCatalog: true, hasProductAPI: true, hasProductSearch: true,
  hasAffiliateProgram: true, hasAffiliateAPI: true, hasAffiliateLinks: true, hasCommissionTracking: true,
  allowsExternalLinks: true, allowsExternalTraffic: true, hasContentRestrictions: true,
};

const VIDEO_COMMERCE: PlatformCapabilities = {
  ...NO_PRODUCT,
  hasProductCatalog: true, hasProductSearch: true, hasAffiliateProgram: true, hasAffiliateLinks: true,
  hasCommissionTracking: true, hasVideoContent: true, hasVideoAPI: true, canEmbedVideo: true,
  canLinkVideoToProduct: true, requiresContentAuthorization: true, allowsExternalLinks: true,
  allowsExternalTraffic: true, hasContentRestrictions: true,
};

const SOCIAL_VIDEO: PlatformCapabilities = {
  ...VIDEO_COMMERCE,
  hasAffiliateAPI: false,
};

const COMMUNICATION: PlatformCapabilities = {
  ...NO_PRODUCT,
  allowsExternalLinks: true, allowsExternalTraffic: true, requiresOptIn: true,
  requiresTemplateApproval: true, hasContentRestrictions: true,
};

const MARKETPLACE_RULES: PlatformRules = {
  allowedActions: ["share_affiliate_links", "product_discovery", "product_search"],
  restrictedActions: ["auto_purchase", "auto_checkout"],
  requiresReview: ["bulk_operations"],
  blockedActions: ["spam", "fraudulent_activity"],
  ruleComments: { share_affiliate_links: "Use somente links oficiais do programa e respeite os termos vigentes." },
};

const ANALYSIS_RULES: PlatformRules = {
  allowedActions: ["product_discovery", "manual_review"],
  restrictedActions: ["automated_operations", "bulk_operations"],
  requiresReview: ["affiliate_activation", "content_distribution"],
  blockedActions: ["spam", "fraudulent_activity", "unauthorized_content_use"],
  ruleComments: { status: "Em análise: validar elegibilidade, API e políticas antes de ativar automações." },
};

const BASIC_CONTENT: ContentRules = {
  canEmbed: false, canDownload: false, canEdit: false, canRemoveWatermark: false,
  canHost: false, requiresAttribution: false,
};

const VIDEO_CONTENT: ContentRules = {
  canEmbed: true, canDownload: false, canEdit: false, canRemoveWatermark: false,
  canHost: false, requiresAttribution: true,
};

const AFFILIATE_RULES: AffiliateRules = {
  canShareLinks: true, canTrackConversions: true, requiresApproval: false,
  commissionStructure: "dynamic", payoutPeriod: "monthly",
  restrictions: ["Respeitar as regras e termos vigentes do programa de afiliados."],
};

const ANALYSIS_AFFILIATE: AffiliateRules = {
  canShareLinks: true, canTrackConversions: false, requiresApproval: true,
  commissionStructure: "dynamic", payoutPeriod: "a validar",
  restrictions: ["Validar programa, elegibilidade, tracking e canais autorizados antes da ativação."],
};

function analysisPlatform(
  id: string,
  name: string,
  icon: string,
  color: string,
  category: PlatformConfig["category"],
  description: string,
  capabilities: PlatformCapabilities,
  fields: CredentialField[] = [],
  contentRules: ContentRules = BASIC_CONTENT,
): PlatformConfig {
  return {
    id, name, icon, color, description, category, capabilities, status: "pending",
    credentialFields: fields, docsUrl: "#", setupGuide: "Em análise. Validar documentação oficial, elegibilidade, credenciais e políticas antes de ativar.",
    rules: ANALYSIS_RULES,
    affiliateRules: capabilities.hasAffiliateProgram ? ANALYSIS_AFFILIATE : undefined,
    contentRules,
  };
}

export const TIKTOK_SHOP_CONFIG: PlatformConfig = {
  id: "tiktok_shop", name: "TikTok Shop", icon: "🎵", color: "#000000",
  description: "Produtos, afiliados e vídeo commerce; tráfego externo depende do programa aplicável.", category: "marketplace",
  capabilities: { ...MARKETPLACE_AFFILIATE, hasVideoContent: true, hasVideoAPI: true, canEmbedVideo: true, canLinkVideoToProduct: true, requiresContentAuthorization: true }, status: "external_traffic",
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
    { key: "partner_id", label: "Partner ID", type: "text", required: true }, { key: "partner_key", label: "Partner Key", type: "password", required: true }, { key: "affiliate_id", label: "Affiliate ID", type: "text", required: true },
  ], docsUrl: "https://open.shopee.com/", setupGuide: "Cadastre a aplicação/programa correspondente e informe as credenciais oficiais.", rules: MARKETPLACE_RULES, affiliateRules: AFFILIATE_RULES, contentRules: BASIC_CONTENT,
};

export const KWAI_CONFIG: PlatformConfig = {
  id: "kwai", name: "Kwai / Kwai Shop", icon: "📱", color: "#FF6900", description: "Vídeo e recursos de Shop sujeitos à disponibilidade e elegibilidade.", category: "video",
  capabilities: { ...SOCIAL_VIDEO, hasProductAPI: false }, status: "pending",
  credentialFields: [{ key: "api_key", label: "API Key", type: "password", required: false, placeholder: "kwai_...", helpText: "Use somente credenciais fornecidas oficialmente." }], docsUrl: "https://www.kwai.com/", setupGuide: "A disponibilidade de Shop/API pode depender de convite, conta, região e programa vigente.",
  rules: { ...ANALYSIS_RULES, ruleComments: { shop: "Validar disponibilidade oficial antes de ativar." } }, affiliateRules: ANALYSIS_AFFILIATE, contentRules: VIDEO_CONTENT,
};

export const MERCADO_LIVRE_CONFIG: PlatformConfig = {
  id: "mercadolivre", name: "Mercado Livre", icon: "ML", color: "#FFE600", description: "Produtos e recursos de afiliados via APIs/programas oficiais.", category: "marketplace", capabilities: MARKETPLACE_AFFILIATE, status: "available", connectorId: "mercadolivre",
  credentialFields: [{ key: "client_id", label: "Client ID", type: "text", required: true }, { key: "client_secret", label: "Client Secret", type: "password", required: true }, { key: "affiliate_id", label: "Affiliate ID", type: "text", required: true }], docsUrl: "https://developers.mercadolivre.com.br/", setupGuide: "Crie o aplicativo no Mercado Livre Developers e configure OAuth/programa de afiliados conforme elegibilidade.", rules: MARKETPLACE_RULES, affiliateRules: AFFILIATE_RULES, contentRules: BASIC_CONTENT,
};

export const ALIEXPRESS_CONFIG: PlatformConfig = {
  id: "aliexpress", name: "AliExpress", icon: "A", color: "#FF4747", description: "Produtos e afiliados via programas e APIs oficiais.", category: "marketplace", capabilities: MARKETPLACE_AFFILIATE, status: "available", connectorId: "aliexpress",
  credentialFields: [{ key: "app_key", label: "App Key", type: "text", required: true }, { key: "app_secret", label: "App Secret", type: "password", required: true }, { key: "tracking_id", label: "Tracking ID", type: "text", required: true }], docsUrl: "https://portals.aliexpress.com/", setupGuide: "Cadastre a aplicação/programa e informe as credenciais oficiais.", rules: MARKETPLACE_RULES, affiliateRules: AFFILIATE_RULES, contentRules: BASIC_CONTENT,
};

export const AMAZON_CONFIG: PlatformConfig = {
  id: "amazon", name: "Amazon", icon: "A", color: "#FF9900", description: "Produtos via Amazon Associates/Product Advertising API.", category: "marketplace", capabilities: MARKETPLACE_AFFILIATE, status: "available",
  credentialFields: [{ key: "access_key", label: "Access Key", type: "text", required: true }, { key: "secret_key", label: "Secret Key", type: "password", required: true }, { key: "associate_id", label: "Associate ID", type: "text", required: true }], docsUrl: "https://affiliate-program.amazon.com/", setupGuide: "Configure Amazon Associates e a API elegível para sua conta/região.", rules: MARKETPLACE_RULES, affiliateRules: AFFILIATE_RULES, contentRules: BASIC_CONTENT,
};

export const WHATSAPP_CONFIG: PlatformConfig = {
  id: "whatsapp", name: "WhatsApp Business", icon: "◉", color: "#25D366", description: "WhatsApp Business Cloud API para comunicação com opt-in.", category: "communication", capabilities: { ...COMMUNICATION, requiresTemplateApproval: true }, status: "available", connectorId: "whatsapp",
  credentialFields: [{ key: "business_account_id", label: "Business Account ID", type: "text", required: true }, { key: "phone_number_id", label: "Phone Number ID", type: "text", required: true }, { key: "access_token", label: "Access Token", type: "password", required: true }], docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api", setupGuide: "Configure no Meta Business e use templates/regras de mensageria aplicáveis.", rules: { allowedActions: ["send_templates", "send_messages", "opt_in"], restrictedActions: ["send_free_text_first_message"], requiresReview: ["custom_templates"], blockedActions: ["spam", "unsolicited_messages"], ruleComments: {} }, affiliateRules: { canShareLinks: true, canTrackConversions: false, requiresApproval: true, commissionStructure: "dynamic", payoutPeriod: "pending", restrictions: ["Comunicações promocionais dependem de opt-in e políticas aplicáveis."] }, contentRules: BASIC_CONTENT,
};

export const TELEGRAM_CONFIG: PlatformConfig = {
  id: "telegram", name: "Telegram", icon: "✈", color: "#26A5E4", description: "Envio de ofertas e notificações via Telegram Bot.", category: "communication", capabilities: { ...COMMUNICATION, requiresTemplateApproval: false }, status: "available", connectorId: "telegram",
  credentialFields: [{ key: "bot_token", label: "Bot Token", type: "password", placeholder: "123456789:AA...", required: true, helpText: "Nunca exponha o token no navegador." }, { key: "channel_id", label: "Channel ID", type: "text", placeholder: "@meucanal ou -100...", required: false }], docsUrl: "https://core.telegram.org/bots/api", setupGuide: "Crie um bot com @BotFather e informe o token.", rules: { allowedActions: ["send_messages", "send_links", "send_media"], restrictedActions: ["spam"], requiresReview: [], blockedActions: ["flood", "harassment"], ruleComments: {} }, affiliateRules: { canShareLinks: true, canTrackConversions: false, requiresApproval: false, commissionStructure: "dynamic", payoutPeriod: "pending", restrictions: ["Respeitar regras do canal e do programa de afiliados utilizado."] }, contentRules: BASIC_CONTENT,
};

// Emerging marketplaces — registered as pending until official access, API and policy validation is complete.
export const SHEIN_CONFIG = analysisPlatform("shein", "Shein", "👗", "#111111", "marketplace", "Moda e lifestyle; programa de afiliados em análise para o hub.", MARKETPLACE_AFFILIATE, [
  { key: "affiliate_id", label: "Affiliate ID", type: "text", required: true }, { key: "tracking_id", label: "Tracking ID", type: "text", required: true },
]);
export const TEMU_CONFIG = analysisPlatform("temu", "Temu", "🛒", "#FF6B00", "marketplace", "Marketplace em análise para produtos e afiliados.", MARKETPLACE_AFFILIATE, [{ key: "affiliate_id", label: "Affiliate ID", type: "text", required: true }]);
export const MAGALU_CONFIG = analysisPlatform("magalu", "Magalu", "M", "#0086FF", "marketplace", "Marketplace brasileiro com integração de afiliados em análise.", MARKETPLACE_AFFILIATE);
export const AMERICANAS_CONFIG = analysisPlatform("americanas", "Americanas", "A", "#E60012", "marketplace", "Marketplace brasileiro com canal de afiliados em análise.", MARKETPLACE_AFFILIATE);
export const CASAS_BAHIA_CONFIG = analysisPlatform("casas_bahia", "Casas Bahia", "CB", "#0055A4", "marketplace", "Marketplace brasileiro em análise para integração e afiliados.", MARKETPLACE_AFFILIATE);
export const NETSHOES_CONFIG = analysisPlatform("netshoes", "Netshoes", "N", "#111111", "marketplace", "Marketplace especializado em esportes, em análise.", MARKETPLACE_AFFILIATE);
export const DAFITI_CONFIG = analysisPlatform("dafiti", "Dafiti", "D", "#111111", "marketplace", "Moda e lifestyle, em análise para integração de afiliados.", MARKETPLACE_AFFILIATE);

// Affiliate networks — pending validation; no live connector is exposed until official API/auth is implemented.
export const HOTMART_CONFIG = analysisPlatform("hotmart", "Hotmart", "🔥", "#FF6B00", "affiliate", "Infoprodutos e afiliados; integração em análise.", { ...SOCIAL_VIDEO, hasVideoAPI: false }, [
  { key: "affiliate_id", label: "Affiliate ID", type: "text", required: true }, { key: "api_token", label: "API Token", type: "password", required: true },
], VIDEO_CONTENT);
export const KIANDA_CONFIG = analysisPlatform("kianda", "Kianda", "K", "#111111", "affiliate", "Rede de afiliados e e-commerce em análise.", { ...MARKETPLACE_AFFILIATE, hasAffiliateAPI: false });
export const EDUZZ_CONFIG = analysisPlatform("eduzz", "Eduzz", "E", "#6C3EF4", "affiliate", "Infoprodutos e afiliados em análise.", { ...MARKETPLACE_AFFILIATE, hasAffiliateAPI: false });
export const MONETIZZE_CONFIG = analysisPlatform("monetizze", "Monetizze", "M", "#111111", "affiliate", "Infoprodutos e afiliados em análise.", { ...MARKETPLACE_AFFILIATE, hasAffiliateAPI: false });
export const PEPO_CONFIG = analysisPlatform("pepo", "Pepo", "P", "#111111", "affiliate", "Produtos físicos e digitais; integração em análise.", { ...MARKETPLACE_AFFILIATE, hasAffiliateAPI: false });
export const LOMADEE_CONFIG = analysisPlatform("lomadee", "Lomadee", "L", "#111111", "affiliate", "Rede de afiliados e ofertas; integração em análise.", { ...MARKETPLACE_AFFILIATE, hasAffiliateAPI: false });

// Video commerce — pending validation; cards are operational in the registry but have no live connector yet.
export const YOUTUBE_SHOPPING_CONFIG = analysisPlatform("youtube_shopping", "YouTube Shopping", "▶️", "#FF0000", "video", "Produtos vinculados ao ecossistema de vídeo do YouTube; em análise.", VIDEO_COMMERCE, [
  { key: "channel_id", label: "Channel ID", type: "text", required: true }, { key: "api_key", label: "API Key", type: "password", required: true },
], VIDEO_CONTENT);
export const INSTAGRAM_SHOPPING_CONFIG = analysisPlatform("instagram_shopping", "Instagram Shopping", "📸", "#E4405F", "video", "Produtos, conteúdo e afiliados via ecossistema do Instagram; em análise.", SOCIAL_VIDEO, [
  { key: "business_id", label: "Business ID", type: "text", required: true }, { key: "access_token", label: "Access Token", type: "password", required: true },
], VIDEO_CONTENT);
export const FACEBOOK_SHOPS_CONFIG = analysisPlatform("facebook_shops", "Facebook Shops", "f", "#1877F2", "video", "Catálogo e comércio no ecossistema Facebook/Meta; em análise.", SOCIAL_VIDEO, [], VIDEO_CONTENT);
export const PINTEREST_SHOPPING_CONFIG = analysisPlatform("pinterest_shopping", "Pinterest Shopping", "P", "#BD081C", "video", "Descoberta visual de produtos e shopping; em análise.", SOCIAL_VIDEO, [], VIDEO_CONTENT);
export const REELS_SHOPPING_CONFIG = analysisPlatform("reels_shopping", "Reels Shopping (Meta)", "R", "#E1306C", "video", "Produtos associados a conteúdo Reels; em análise.", SOCIAL_VIDEO, [], VIDEO_CONTENT);

// Omnichannel communication — registered now, activated only after provider/API and consent validation.
export const INSTAGRAM_DMS_CONFIG = analysisPlatform("instagram_dms", "Instagram DMs", "✉", "#E4405F", "communication", "Direct Messages para comunicação automatizada; em análise.", COMMUNICATION, [{ key: "access_token", label: "Access Token", type: "password", required: true }]);
export const FACEBOOK_MESSENGER_CONFIG = analysisPlatform("facebook_messenger", "Facebook Messenger", "M", "#0084FF", "communication", "Messenger para automação de atendimento; em análise.", COMMUNICATION, [{ key: "access_token", label: "Access Token", type: "password", required: true }]);
export const TWILIO_SMS_CONFIG = analysisPlatform("twilio_sms", "SMS (Twilio)", "SMS", "#F22F46", "communication", "SMS transacional/promocional via Twilio; em análise e condicionado a opt-in.", COMMUNICATION, [
  { key: "account_sid", label: "Account SID", type: "text", required: true }, { key: "auth_token", label: "Auth Token", type: "password", required: true }, { key: "from_number", label: "From Number", type: "text", required: true },
]);
export const EMAIL_MARKETING_CONFIG = analysisPlatform("email_marketing", "Email Marketing", "✉", "#111111", "communication", "Automação de email para ofertas e jornadas; em análise e condicionada a consentimento.", COMMUNICATION, [
  { key: "provider", label: "Provider", type: "text", required: true }, { key: "api_key", label: "API Key", type: "password", required: true },
]);

export const ALL_PLATFORMS: Record<string, PlatformConfig> = {
  tiktok_shop: TIKTOK_SHOP_CONFIG, shopee: SHOPEE_CONFIG, kwai: KWAI_CONFIG,
  mercadolivre: MERCADO_LIVRE_CONFIG, aliexpress: ALIEXPRESS_CONFIG, amazon: AMAZON_CONFIG,
  whatsapp: WHATSAPP_CONFIG, telegram: TELEGRAM_CONFIG,
  shein: SHEIN_CONFIG, temu: TEMU_CONFIG, magalu: MAGALU_CONFIG, americanas: AMERICANAS_CONFIG,
  casas_bahia: CASAS_BAHIA_CONFIG, netshoes: NETSHOES_CONFIG, dafiti: DAFITI_CONFIG,
  hotmart: HOTMART_CONFIG, kianda: KIANDA_CONFIG, eduzz: EDUZZ_CONFIG, monetizze: MONETIZZE_CONFIG, pepo: PEPO_CONFIG, lomadee: LOMADEE_CONFIG,
  youtube_shopping: YOUTUBE_SHOPPING_CONFIG, instagram_shopping: INSTAGRAM_SHOPPING_CONFIG, facebook_shops: FACEBOOK_SHOPS_CONFIG,
  pinterest_shopping: PINTEREST_SHOPPING_CONFIG, reels_shopping: REELS_SHOPPING_CONFIG,
  instagram_dms: INSTAGRAM_DMS_CONFIG, facebook_messenger: FACEBOOK_MESSENGER_CONFIG, twilio_sms: TWILIO_SMS_CONFIG, email_marketing: EMAIL_MARKETING_CONFIG,
};

export const PLATFORMS = ALL_PLATFORMS;

export const PLATFORMS_BY_CATEGORY: Record<PlatformConfig["category"], PlatformConfig[]> = {
  marketplace: [TIKTOK_SHOP_CONFIG, SHOPEE_CONFIG, MERCADO_LIVRE_CONFIG, ALIEXPRESS_CONFIG, AMAZON_CONFIG, SHEIN_CONFIG, TEMU_CONFIG, MAGALU_CONFIG, AMERICANAS_CONFIG, CASAS_BAHIA_CONFIG, NETSHOES_CONFIG, DAFITI_CONFIG],
  affiliate: [TIKTOK_SHOP_CONFIG, SHOPEE_CONFIG, MERCADO_LIVRE_CONFIG, ALIEXPRESS_CONFIG, AMAZON_CONFIG, HOTMART_CONFIG, KIANDA_CONFIG, EDUZZ_CONFIG, MONETIZZE_CONFIG, PEPO_CONFIG, LOMADEE_CONFIG],
  video: [TIKTOK_SHOP_CONFIG, KWAI_CONFIG, YOUTUBE_SHOPPING_CONFIG, INSTAGRAM_SHOPPING_CONFIG, FACEBOOK_SHOPS_CONFIG, PINTEREST_SHOPPING_CONFIG, REELS_SHOPPING_CONFIG],
  communication: [TELEGRAM_CONFIG, WHATSAPP_CONFIG, INSTAGRAM_DMS_CONFIG, FACEBOOK_MESSENGER_CONFIG, TWILIO_SMS_CONFIG, EMAIL_MARKETING_CONFIG],
  compliance: [],
};

export const PLATFORM_LIST = Object.values(ALL_PLATFORMS);
