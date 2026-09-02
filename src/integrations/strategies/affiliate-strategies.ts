import type { PlatformConfig } from "../core/types";

export type AffiliateStrategyMethod =
  | "direct_link"
  | "tracking_link"
  | "external_traffic"
  | "embed"
  | "referral";

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

export const AFFILIATE_STRATEGIES: Record<string, AffiliateStrategy> = {
  tiktok_shop: {
    platformId: "tiktok_shop", name: "TikTok Shop — Tráfego Externo",
    description: "Usar links oficiais de afiliado quando o programa de tráfego externo estiver disponível para a conta.", method: "external_traffic",
    allowedChannels: ["Site próprio", "Aplicativo próprio", "Redes sociais", "WhatsApp", "Telegram", "Blog", "Email"],
    bestPractices: ["Usar o link oficial gerado pela plataforma", "Respeitar as regras de conteúdo e divulgação", "Não republicar conteúdo de terceiros sem autorização"],
    restrictions: ["Não baixar/republicar vídeos sem direito", "Não remover marca d'água", "Não tratar uma capacidade ainda não habilitada como disponível"],
    example: "Exibir um produto com seu link oficial de afiliado em um canal externo permitido pelo programa aplicável.",
  },
  shopee: {
    platformId: "shopee", name: "Shopee — Link de Afiliado", description: "Divulgação por links oficiais do programa de afiliados.", method: "direct_link",
    allowedChannels: ["Site próprio", "Redes sociais", "WhatsApp", "Telegram", "Blog"],
    bestPractices: ["Usar tracking oficial", "Manter transparência sobre afiliados", "Respeitar as políticas vigentes"],
    restrictions: ["Não usar tráfego fraudulento", "Não induzir cliques falsos"],
    example: "Compartilhar um produto com link oficial de afiliado em um conteúdo editorial permitido.",
  },
  mercadolivre: {
    platformId: "mercadolivre", name: "Mercado Livre — Link de Afiliado", description: "Links rastreáveis conforme o programa e a conta.", method: "tracking_link",
    allowedChannels: ["Site próprio", "Redes sociais", "Blog", "Email", "WhatsApp"],
    bestPractices: ["Usar tracking oficial", "Respeitar políticas de divulgação", "Não usar spam"],
    restrictions: ["Não automatizar compras", "Não usar bots para gerar conversões artificiais"],
    example: "Publicar uma recomendação editorial com o link rastreável oficial do programa.",
  },
  aliexpress: {
    platformId: "aliexpress", name: "AliExpress — Link de Afiliado", description: "Links oficiais do programa de afiliados e tracking.", method: "tracking_link",
    allowedChannels: ["Site próprio", "Redes sociais", "Blog", "Email"],
    bestPractices: ["Usar Tracking ID válido", "Respeitar políticas do programa"],
    restrictions: ["Não automatizar pedidos", "Não usar spam ou tráfego fraudulento"],
    example: "Compartilhar um produto por meio do link oficial rastreável do programa.",
  },
  amazon: {
    platformId: "amazon", name: "Amazon — Associates", description: "Links de associado vinculados à conta e às políticas do programa.", method: "direct_link",
    allowedChannels: ["Site próprio", "Blog", "YouTube", "Redes sociais", "Email"],
    bestPractices: ["Usar identificador oficial", "Declarar a relação de afiliado quando exigido", "Respeitar as políticas do programa"],
    restrictions: ["Não gerar tráfego fraudulento", "Não usar identificadores inválidos"],
    example: "Recomendar um produto em conteúdo próprio com o link oficial de associado.",
  },
  whatsapp: {
    platformId: "whatsapp", name: "WhatsApp — Ofertas", description: "Comunicação promocional condicionada a opt-in e políticas da Meta.", method: "referral",
    allowedChannels: ["WhatsApp Business"], bestPractices: ["Obter opt-in", "Usar templates quando exigidos", "Respeitar limites e políticas de mensageria"],
    restrictions: ["Não enviar spam", "Não iniciar comunicação promocional sem a autorização exigida"],
    example: "Enviar uma oferta para um contato que autorizou receber comunicações promocionais.",
  },
  telegram: {
    platformId: "telegram", name: "Telegram — Ofertas", description: "Publicação de ofertas por bot em canais ou grupos onde o envio é autorizado.", method: "direct_link",
    allowedChannels: ["Telegram", "Canal do Telegram", "Grupo do Telegram"], bestPractices: ["Respeitar regras do canal", "Manter mensagens relevantes", "Evitar flood"],
    restrictions: ["Não fazer flood", "Não enviar conteúdo enganoso ou abusivo"],
    example: "Publicar uma oferta com descrição clara e link oficial em um canal administrado pelo projeto.",
  },
};

export function getAffiliateStrategy(platform: PlatformConfig): AffiliateStrategy | undefined {
  return AFFILIATE_STRATEGIES[platform.id];
}
