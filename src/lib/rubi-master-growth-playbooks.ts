/**
 * Shadow Master action playbooks for the three RUBI acquisition funnels.
 * Recommendations derive from verified inventory and commercial counters;
 * they are not proof that external Ads, AI video, Kairos or influencer payouts work.
 */
export type RubiMasterGrowthSnapshot={
 totalProducts:number;
 readyProducts:number;
 activeSuppliersWithoutHost:number;
 productAuditPartial:boolean;
 partnerApproved:number;
 partnerPending:number;
 partnerActiveLinks:number;
 partnerVisits30d:number;
 partnerConfirmedSales30d:number;
 merchantApproved:number;
};
export type RubiMasterGrowthAction={
 id:"ai_seller"|"direct"|"creators"|"merchant";
 heading:string;
 audience:string;
 phase:"blocked"|"setup"|"measure";
 status:string;
 nextStep:string;
 rationale:string;
 href:string;
 hrefLabel:string;
 checkpoints:string[];
};
const firstProductBlocker=(s:RubiMasterGrowthSnapshot):string|null=>{
 if(s.activeSuppliersWithoutHost>0)return "Há fornecedor ativo sem domínio de checkout aprovado.";
 if(s.totalProducts===0)return "Não há produtos cadastrados na RUBI Store.";
 if(s.readyProducts===0)return "Ainda não há produto elegível para varejo neste diagnóstico.";
 if(s.productAuditPartial)return "O inventário foi analisado parcialmente; complete a auditoria antes de escalar.";
 return null;
};
export function buildRubiMasterGrowthPlaybooks(s:RubiMasterGrowthSnapshot):RubiMasterGrowthAction[]{
 const block=firstProductBlocker(s);
 const common=block?{
  phase:"blocked" as const,status:"Bloqueado por preparação comercial",nextStep:block,
  href:"/admin/hub-catalog",hrefLabel:"Revisar catálogo e fornecedores"
 }:null;
 return [
  {id:"ai_seller",heading:"Agente vendedor + IA",audience:"Consumidores e nichos especializados",
   ...(common??{phase:"setup" as const,status:"Preparação assistida, sem conexão de IA/Ads",
    nextStep:"Criar brief com oferta comprovada, prompt, roteiro, vídeo autorizado e limite de orçamento.",
    href:"/admin/hub-catalog",hrefLabel:"Abrir Offer + Movement Engine"}),
   rationale:"A IA pode preparar o criativo; publicação, custo e validação de promessas exigem aprovação.",
   checkpoints:["Oferta e evidências revisadas","Roteiro/vídeo com direitos autorizados","Orçamento aprovado pelo Master","Página e checkout testados","CPA e pedidos pagos conciliados"]},
  {id:"direct",heading:"Resposta direta",audience:"Consumidores e lojistas",
   ...(common??{phase:"setup" as const,status:"Preparação de campanhas",
    nextStep:"Conectar anúncio, variante criativa, página de vendas e pré-checkout aprovado; medir a origem.",
    href:"/admin/hub-catalog",hrefLabel:"Abrir movimentos e páginas"}),
   rationale:"Os acessos ao checkout não provam pagamento. Separar eventos de campanha, cotações e pedidos.",
   checkpoints:["Criativo de problema/solução legítima","Landing RUBI publicada em HTTPS","Página → checkout revisados","Orçamento e segmentação aprovados","Venda/cotação medida pela fonte apropriada"]},
  {id:"creators",heading:"Times de influenciadores",audience:"Nano, micro, experts, médio e grande porte",
   phase:s.partnerApproved===0?"setup":"measure",
   status:s.partnerApproved===0?"Captar e aprovar primeiros criadores":"Parceiros aprovados: acompanhar a ativação",
   nextStep:s.partnerPending>0?
    "Revisar solicitações pendentes antes de atribuir produtos ou fechar acordos.":
    s.partnerApproved===0?"Prospectar por nicho e divulgar a página pública de inscrição.":"Conferir grants e links de cada criador; comparar visitas e pedidos confirmados.",
   rationale:`${s.partnerApproved} parceiros aprovados, ${s.partnerActiveLinks} links ativos, ${s.partnerVisits30d} visitas e ${s.partnerConfirmedSales30d} vendas confirmadas em 30 dias. Indicadores não mostram ROI nem pessoas únicas.`,
   href:"/admin/hub-catalog",hrefLabel:"Gerir times e parcerias",
   checkpoints:["Criador e audiência qualificados","Condições de patrocínio/comissão revisadas","Produto e link individual autorizados","Kit e divulgação identificada como publicidade","Pedidos/estornos e margem conciliados"]},
  {id:"merchant",heading:"Recorrência dos lojistas",audience:"RUBI Business — apoio aos três funis",
   phase:s.merchantApproved>0?"measure":"setup",
   status:s.merchantApproved>0?"Há comerciantes aprovados":"Aguardar qualificação e aprovação B2B",
   nextStep:s.merchantApproved>0?"Priorizar cotações respondidas e preparar reposição com consentimento.":"Preparar catálogo de atacado e atrair lojistas com campanhas comerciais verificáveis.",
   rationale:`${s.merchantApproved} perfis de lojistas aprovados; não equivale a pedidos ou recompra.`,
   href:"/wholesale",hrefLabel:"Ver jornada do lojista",
   checkpoints:["Preço por faixa e mínimo válidos","Cotação solicitada","Resposta comercial","Reposição acompanhada","Margem e pedidos reconciliados"]}
 ];
}
