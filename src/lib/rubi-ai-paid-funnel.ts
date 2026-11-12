/** RUBI paid acquisition blueprints. These are manual, approval-gated plans, not ad API commands. */
export type RubiPaidFunnelMode="ai_seller_video"|"direct_response";
export type RubiPaidFunnelAudience="consumer"|"merchant"|"partner";
export type RubiPaidFunnelInput={
 mode:RubiPaidFunnelMode;audience:RubiPaidFunnelAudience;
 productId:string;productName:string;campaign:string;
 dailyBudget:number;runDays:number;claimEvidence:string;
};
export function validateRubiPaidFunnel(input:RubiPaidFunnelInput):string[]{
 const errors:string[]=[];
 if(!input.productName.trim())errors.push("Produto precisa estar identificado.");
 if(!/^[a-z0-9][a-z0-9_-]{0,59}$/.test(input.campaign))errors.push("Identificador da campanha inválido.");
 if(!Number.isFinite(input.dailyBudget)||input.dailyBudget<=0||input.dailyBudget>10000)errors.push("Defina limite diário entre R$ 0,01 e R$ 10.000.");
 if(!Number.isSafeInteger(input.runDays)||input.runDays<1||input.runDays>90)errors.push("Defina duração de 1 a 90 dias.");
 if(input.claimEvidence.trim().length<10)errors.push("Descreva a origem verificável das afirmações da oferta.");
 return errors;
}
export function buildRubiPaidFunnelBrief(input:RubiPaidFunnelInput):string{
 const errors=validateRubiPaidFunnel(input);
 if(errors.length)throw new Error(errors.join(" "));
 const budget=(input.dailyBudget*input.runDays).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 const route=input.audience==="merchant"?"/wholesale":input.audience==="partner"?"/partner/portal":"/hub-shop";
 const headline=input.mode==="ai_seller_video"
  ?"Agente vendedor assistido por IA → produto autorizado → prompt e roteiro → vídeo revisado → página RUBI → conversão"
  :"Anúncio → criativo → página de vendas RUBI → pré-checkout → checkout do fornecedor";
 return [
  "RUBI 11× · PLANO DE TRÁFEGO PAGO — RASCUNHO, NÃO PUBLICADO",
  headline,
  "Público: "+({consumer:"consumidor",merchant:"lojista",partner:"parceiro"} as const)[input.audience],
  "Produto: "+input.productName,"Campanha: "+input.campaign,
  "Rota de entrada contextual: "+route,
  "Orçamento proposto: "+input.dailyBudget.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+
   "/dia × "+input.runDays+" dia(s) = teto planejado de "+budget+" (não gasto, não reserva).",
  "Afirmações e comprovação: "+input.claimEvidence.trim(),
  "CRIATIVO: apresentar dor legítima, utilidade verificável, demonstração autorizada e CTA claro.",
  "PÁGINA: oferta, benefícios e provas reais, objeções, preço e condições vigentes; inscrição opcional.",
  "DISTRIBUIÇÃO: definir campanha, origem, público e variantes; reservar orçamento somente após autorização humana.",
  input.mode==="ai_seller_video"?"IA: gerar sugestões de prompt/roteiro/vídeo; revisar direitos de mídia, voz e promessas antes de usar.":"DIRETO: testar variações de anúncio e criativo com página publicada e rastreamento de origem.",
  input.audience==="partner"?"PARCEIROS: apenas produtos liberados e links atribuíveis; não usar UTM como substituto do código individual.":"DESTINO: usar somente páginas autorizadas do perfil e checkout final válido.",
  "APROVAÇÕES: Shadow Master valida oferta, checkout, vídeo, mídia, público, prazo e limite financeiro antes de qualquer anúncio.",
  "GATES: não comprar tráfego sem URL publicada, pixel/eventos verificados, direitos criativos, regras da plataforma e autorização do orçamento.",
  "MEDIÇÃO: impressões confiáveis → cliques → visitas → intenção de checkout/cotação → pedido confirmado; não chamar clique de venda.",
  "MICROINFLUENCIADORES: preparar formatos licenciados de divulgação e orientações com identificação de publicidade; não inventar depoimentos.",
  "EXECUÇÃO: manual, não há conexão automática com conta de anúncios nem API de geração de vídeos."
 ].join("\n\n");
}
