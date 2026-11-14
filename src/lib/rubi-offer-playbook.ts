export type RubiOfferChannel = "instagram" | "tiktok" | "rubi_feed" | "whatsapp" | "telegram" | "partners" | "organic_pages" | "email";
export type RubiOfferPlaybook = {
  product_id: string;
  audience: "consumer" | "merchant" | "partner";
  promise: string;
  verified_benefits: string;
  proof_notes: string;
  creative_hook: string;
  creative_script: string;
  page_headline: string;
  page_body: string;
  objections: string;
  movement_plan: string;
  channels: RubiOfferChannel[];
  stage: "draft" | "ready_for_review";
  published_at?: string | null;
  revision?:number | null;
};
export const RUBI_OFFER_CHANNELS: { value: RubiOfferChannel; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "rubi_feed", label: "Feed RUBI" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "partners", label: "Parceiros" },
  { value: "organic_pages", label: "Páginas orgânicas" },
  { value: "email", label: "E-mail" },
];
export function emptyRubiOfferPlaybook(productId: string, title: string, description: string | null): RubiOfferPlaybook {
  return {
    product_id: productId,
    audience: "consumer",
    promise: "",
    verified_benefits: "",
    proof_notes: "",
    creative_hook: `Conheça ${title}`,
    creative_script: `Primeiro contato: apresente ${title}, mostre o produto de verdade e convide a conferir os detalhes na RUBI.`,
    page_headline: title,
    page_body: description || "",
    objections: "Quais dúvidas de preço, uso, prazo e condições reais precisam ser esclarecidas?",
    movement_plan: "1. Preparar material verdadeiro e autorizado.\n2. Compartilhar em canal elegível com link rastreável.\n3. Medir visitas e saídas ao checkout oficial.\n4. Revisar o texto sem inventar benefícios.",
    channels: [],
    stage: "draft",
  };
}
export function rubiOfferReadiness(value: RubiOfferPlaybook): {score:number; missing:string[]} {
  const checks: [boolean,string][] = [
    [value.promise.trim().length >= 10, "Proposta de valor"],
    [value.verified_benefits.trim().length >= 10, "Benefícios verificáveis"],
    [value.proof_notes.trim().length >= 10, "Origem das afirmações"],
    [value.creative_hook.trim().length >= 6, "Abertura do criativo"],
    [value.creative_script.trim().length >= 20, "Roteiro do criativo"],
    [value.page_headline.trim().length >= 6 && value.page_body.trim().length >= 20, "Página"],
    [value.objections.trim().length >= 10, "Dúvidas e objeções"],
    [value.movement_plan.trim().length >= 20 && value.channels.length > 0, "Movimento e canais"],
  ];
  return {score: Math.round(checks.filter(([ok]) => ok).length / checks.length * 100), missing: checks.filter(([ok]) => !ok).map(([,label]) => label)};
}
