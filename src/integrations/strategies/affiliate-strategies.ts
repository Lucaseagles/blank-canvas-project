export type AffiliateStrategyMethod = "direct_link" | "tracking_link" | "external_traffic" | "embed" | "referral";

export interface AffiliateStrategy {
  platformId: string;
  name: string;
  description: string;
  method: AffiliateStrategyMethod;
  allowedChannels: string[];
  bestPractices: string[];
  restrictions: string[];
  example: string;
}

const strategy = (platformId: string, name: string, description: string, method: AffiliateStrategyMethod, allowedChannels: string[], bestPractices: string[], restrictions: string[], example: string): AffiliateStrategy => ({ platformId, name, description, method, allowedChannels, bestPractices, restrictions, example });

export const AFFILIATE_STRATEGIES: Record<string, AffiliateStrategy> = {
  tiktok_shop: strategy("tiktok_shop", "TikTok Shop — Tráfego Externo", "Links oficiais quando o programa aplicável estiver disponível.", "external_traffic", ["Site próprio", "Redes sociais", "WhatsApp", "Telegram", "Blog", "Email"], ["Usar link oficial", "Respeitar regras de conteúdo", "Não republicar conteúdo sem autorização"], ["Não remover marca d'água", "Não usar tráfego fraudulento"], "Exibir um produto com link oficial de afiliado em canal permitido."),
  shopee: strategy("shopee", "Shopee — Link de Afiliado", "Divulgação por links oficiais do programa.", "direct_link", ["Site próprio", "Redes sociais", "WhatsApp", "Telegram", "Blog"], ["Usar tracking oficial", "Manter transparência", "Respeitar políticas vigentes"], ["Não usar tráfego fraudulento", "Não induzir cliques falsos"], "Compartilhar uma recomendação editorial com link oficial."),
  mercadolivre: strategy("mercadolivre", "Mercado Livre — Link de Afiliado", "Links rastreáveis conforme programa e conta.", "tracking_link", ["Site próprio", "Redes sociais", "Blog", "Email", "WhatsApp"], ["Usar tracking oficial", "Respeitar políticas", "Evitar spam"], ["Não automatizar compras", "Não gerar conversões artificiais"], "Publicar recomendação editorial com link rastreável oficial."),
  aliexpress: strategy("aliexpress", "AliExpress — Link de Afiliado", "Links oficiais e tracking do programa.", "tracking_link", ["Site próprio", "Redes sociais", "Blog", "Email"], ["Usar Tracking ID válido", "Respeitar políticas"], ["Não automatizar pedidos", "Não usar spam ou fraude"], "Compartilhar produto por link oficial rastreável."),
  amazon: strategy("amazon", "Amazon — Associates", "Links de associado vinculados à conta e às políticas vigentes.", "direct_link", ["Site próprio", "Blog", "YouTube", "Redes sociais", "Email"], ["Usar identificador oficial", "Declarar a relação quando exigido", "Respeitar políticas"], ["Não gerar tráfego fraudulento", "Não usar identificadores inválidos"], "Recomendar produto em conteúdo próprio com link oficial."),
  whatsapp: strategy("whatsapp", "WhatsApp — Ofertas", "Comunicação promocional condicionada a opt-in e políticas aplicáveis.", "referral", ["WhatsApp Business"], ["Obter opt-in", "Usar templates quando exigidos", "Respeitar limites"], ["Não enviar spam", "Não iniciar comunicação sem autorização exigida"], "Enviar oferta a contato que autorizou comunicações promocionais."),
  telegram: strategy("telegram", "Telegram — Ofertas", "Publicação de ofertas por bot onde o envio é autorizado.", "direct_link", ["Telegram", "Canal", "Grupo"], ["Respeitar regras do canal", "Manter relevância", "Evitar flood"], ["Não fazer flood", "Não enviar conteúdo enganoso ou abusivo"], "Publicar oferta com descrição clara e link oficial."),
  shein: strategy("shein", "Shein — Em análise", "Estratégia reservada para validação do programa e tracking oficial.", "tracking_link", ["A validar"], ["Validar programa e elegibilidade", "Usar tracking oficial", "Manter transparência"], ["Não ativar automações antes da validação", "Não usar tráfego fraudulento"], "Após validação, usar link oficial em conteúdo editorial permitido."),
  temu: strategy("temu", "Temu — Em análise", "Estratégia reservada para validação do programa e canais autorizados.", "tracking_link", ["A validar"], ["Validar elegibilidade", "Usar ID oficial", "Respeitar políticas"], ["Não usar spam", "Não ativar automações sem validação"], "Após validação, compartilhar produto com tracking oficial."),
  hotmart: strategy("hotmart", "Hotmart — Em análise", "Infoprodutos e afiliados aguardando validação da integração.", "tracking_link", ["Site", "Blog", "YouTube", "Redes sociais", "Email"], ["Validar API/programa", "Usar link oficial", "Manter transparência"], ["Não usar spam", "Não prometer resultados indevidos"], "Após validação, publicar conteúdo próprio com link oficial."),
  youtube_shopping: strategy("youtube_shopping", "YouTube Shopping — Vídeo + Produto", "Produtos associados ao ecossistema de vídeo, aguardando validação no hub.", "embed", ["YouTube"], ["Usar ferramentas oficiais", "Manter transparência", "Respeitar direitos do conteúdo"], ["Não baixar/republicar conteúdo sem autorização"], "Publicar conteúdo próprio com produtos vinculados por recurso oficial."),
  instagram_shopping: strategy("instagram_shopping", "Instagram Shopping — Produtos", "Produtos e afiliados via ecossistema Instagram, em análise.", "embed", ["Instagram"], ["Usar ferramentas oficiais", "Manter transparência", "Respeitar políticas"], ["Não baixar/republicar conteúdo sem autorização"], "Usar recursos oficiais de produto em conteúdo próprio após elegibilidade."),
};

const pendingStrategies: Array<[string, string, string, string]> = [
  ["magalu", "Magalu — Em análise", "Marketplace brasileiro e afiliados aguardando validação.", "direct_link"],
  ["americanas", "Americanas — Em análise", "Marketplace e afiliados aguardando validação.", "direct_link"],
  ["casas_bahia", "Casas Bahia — Em análise", "Marketplace e afiliados aguardando validação.", "direct_link"],
  ["netshoes", "Netshoes — Em análise", "Produtos esportivos e afiliados aguardando validação.", "tracking_link"],
  ["dafiti", "Dafiti — Em análise", "Moda e lifestyle aguardando validação.", "tracking_link"],
  ["kianda", "Kianda — Em análise", "Rede de afiliados aguardando validação.", "tracking_link"],
  ["eduzz", "Eduzz — Em análise", "Infoprodutos e afiliados aguardando validação.", "tracking_link"],
  ["monetizze", "Monetizze — Em análise", "Infoprodutos e afiliados aguardando validação.", "tracking_link"],
  ["pepo", "Pepo — Em análise", "Produtos físicos e digitais aguardando validação.", "tracking_link"],
  ["lomadee", "Lomadee — Em análise", "Rede de ofertas e afiliados aguardando validação.", "tracking_link"],
  ["facebook_shops", "Facebook Shops — Em análise", "Comércio e catálogo Meta aguardando validação.", "embed"],
  ["pinterest_shopping", "Pinterest Shopping — Em análise", "Shopping visual aguardando validação.", "embed"],
  ["reels_shopping", "Reels Shopping — Em análise", "Produtos em Reels aguardando validação.", "embed"],
  ["instagram_dms", "Instagram DMs — Em análise", "Automação de Direct aguardando validação da API e permissões.", "referral"],
  ["facebook_messenger", "Facebook Messenger — Em análise", "Automação de Messenger aguardando validação.", "referral"],
  ["twilio_sms", "SMS (Twilio) — Em análise", "SMS condicionado a consentimento e validação do provedor.", "referral"],
  ["email_marketing", "Email Marketing — Em análise", "Automação de email condicionada a consentimento e provedor validado.", "direct_link"],
];

for (const [id, name, description, method] of pendingStrategies) {
  AFFILIATE_STRATEGIES[id] = strategy(id, name, description, method as AffiliateStrategyMethod, ["A validar"], ["Validar integração e elegibilidade", "Respeitar políticas e consentimento aplicáveis"], ["Não ativar sem validação", "Não usar spam ou tráfego fraudulento"], "Ativar somente após validação oficial e usar o mecanismo autorizado pela plataforma." );
}

export function getAffiliateStrategy(platform: { id: string }): AffiliateStrategy | undefined {
  return AFFILIATE_STRATEGIES[platform.id];
}
