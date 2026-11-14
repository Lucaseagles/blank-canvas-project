import {GROWTH_STRATEGIES,type GrowthPillar} from "./rubi-growth-11x";

/** Five-pillar operational plan, derived exclusively from independent observed counters.
 * Counts are not linked cohorts and never imply actual sales or conversion.
 */
export type RubiFlywheelInput={
 totalProducts:number;readyProducts:number;inventoryPartial:boolean;suppliersWithoutHost:number;
 consumerProfiles:number;storeViews:number;storeCheckoutIntents:number;
 marketplaceProductViews:number;
 partnerApproved:number;partnerPending:number;partnerActiveLinks:number;partnerVisits:number;partnerSales:number;
 merchantApproved:number;merchantQuotes:number;merchantResponses:number;merchantReplenishments:number;
};
export type RubiFlywheelAction={
 pillar:GrowthPillar;title:string;state:"blocked"|"setup"|"measure";
 priority:number;reason:string;nextAction:string;href:string;
 checklist:string[];tracked:number;strategyCount:number;
};
const strategyCount=(pillar:GrowthPillar)=>GROWTH_STRATEGIES.filter(s=>s.pillar===pillar).length;

export function buildRubiEcosystemFlywheel(s:RubiFlywheelInput):RubiFlywheelAction[]{
 const storeBlock=s.totalProducts===0?"Nenhum SKU real cadastrado.":
  s.suppliersWithoutHost>0?"Fornecedor sem host de checkout aprovado.":
  s.readyProducts===0?"Nenhum SKU validado para varejo.":s.inventoryPartial?
  "Inventário parcial; verifique os SKUs não analisados.":null;
 const store: RubiFlywheelAction={
  pillar:"store",title:"Store · Margem principal",
  state:storeBlock?"blocked":s.storeViews>0?"measure":"setup",
  priority:storeBlock?1:s.storeViews>0&&s.storeCheckoutIntents===0?3:7,
  reason:storeBlock??(s.storeViews===0?"Catálogo elegível sem visualizações registradas.":`${s.storeViews} visualizações e ${s.storeCheckoutIntents} intenções de checkout; eventos independentes, não pedidos pagos.`),
  nextAction:storeBlock?"Cadastrar SKU, evidências comerciais e checkout oficial; completar QA antes de divulgar.":
   s.storeViews===0?"Publicar uma oferta com movimento e categoria correspondentes aos interesses declarados.":
   s.storeCheckoutIntents===0?"Rever promessa, criativo, página, adequação de público e CTA; não inferir pagamento.":
   "Comparar canais e jornadas qualificadas, conferindo no fornecedor os pedidos realmente pagos.",
  href:"/admin/hub-catalog",tracked:s.storeCheckoutIntents,strategyCount:strategyCount("store"),
  checklist:["Preço, custo e direitos documentados","Movement e página revisados","Checkout legítimo","Rastreamento de origem e jornada","Pagamento conciliado antes de calcular margem líquida"]
 };
 const eclipse: RubiFlywheelAction={
  pillar:"eclipse",title:"Eclipse · Base e relacionamento",
  state:s.consumerProfiles===0?"setup":"measure",
  priority:s.consumerProfiles===0?2:6,
  reason:s.consumerProfiles===0?"Sem perfil comercial consumidor registrado; não presumir audiência ativa.":`${s.consumerProfiles} perfis consumidores; isso não mede usuários ativos ou consentimento para campanhas.`,
  nextAction:s.consumerProfiles===0?"Atrair e orientar consumidores por conteúdo útil e onboarding sem exigir compra.":
   "Analisar preferências explícitas, retenção e sessões válidas; preparar comunicações consentidas.",
  href:"/admin/dashboard",tracked:s.consumerProfiles,strategyCount:strategyCount("eclipse"),
  checklist:["Aquisição por conteúdo com origem clara","Cadastro opcional e preferências","Interesses e consentimento respeitados","Relevância sem excesso de notificações","Recompra medida por coortes reais"]
 };
 const achadinhos: RubiFlywheelAction={
  pillar:"achadinhos",title:"Achadinhos · Aquisição orgânica",
  state:s.marketplaceProductViews>0?"measure":"setup",
  priority:s.marketplaceProductViews===0?3:8,
  reason:s.marketplaceProductViews===0?
   "Sem visualizações orgânicas de Store registradas por canal; marketplace e Store devem ter métricas distintas.":
   `${s.marketplaceProductViews} visualizações de produtos Store atribuídas a canais orgânicos, sem confirmar origem exclusiva de marketplaces.`,
  nextAction:"Testar conteúdo demonstrativo original e ofertas externas legítimas; orientar descoberta para categorias da RUBI sem redirecionamento enganoso.",
  href:"/admin/hub-catalog",tracked:s.marketplaceProductViews,strategyCount:strategyCount("achadinhos"),
  checklist:["Produto e benefício verificáveis","Link oficial e identificação publicitária","UTM/canal consistente","Evitar prova social inventada","Avaliar visitas qualificadas à marca própria"]
 };
 const partners: RubiFlywheelAction={
  pillar:"partners",title:"Partners · Times e distribuição",
  state:s.partnerApproved>0?"measure":"setup",
  priority:s.partnerApproved===0?4:s.partnerActiveLinks===0?3:7,
  reason:`${s.partnerPending} solicitações pendentes, ${s.partnerApproved} parceiros aprovados, ${s.partnerActiveLinks} links ativos e ${s.partnerSales} vendas registradas como confirmadas; sem atribuição automática de lucro.`,
  nextAction:s.partnerPending>0?"Qualificar nicho, audiência e direitos; decidir solicitações pendentes.":
   s.partnerApproved===0?"Procurar nano/micro criadores compatíveis e propor piloto condicionado à aprovação.":
   s.partnerActiveLinks===0?"Vincular produtos somente após acordo e grants individuais; preparar kits licenciados.":
   "Avaliar visitas, pedidos atribuídos, cancelamentos e margem antes de ampliar o time.",
  href:"/admin/hub-catalog",tracked:s.partnerActiveLinks,strategyCount:strategyCount("partners"),
  checklist:["Qualificação e evidências do criador","Produto e público do mesmo nicho","Condições, direitos e acordo aprovados","Link individual e material autorizado","Pedidos confirmados e comissão conciliada"]
 };
 const business: RubiFlywheelAction={
  pillar:"business",title:"Business · Atacado e reposição",
  state:s.merchantApproved===0?"setup":"measure",
  priority:s.merchantApproved===0?5:s.merchantQuotes===0?3:6,
  reason:`${s.merchantApproved} lojistas aprovados, ${s.merchantQuotes} cotações, ${s.merchantResponses} respostas e ${s.merchantReplenishments} solicitações de reposição em 30 dias; não representam compras confirmadas.`,
  nextAction:s.merchantApproved===0?"Qualificar lojistas por segmento, giro, quantidade e capacidade de reposição.":
   s.merchantQuotes===0?"Apresentar catálogo B2B autorizado, mínimo e faixas de volume.":
   "Revisar cotações sem resposta e reposição consentida; medir compras e margem comprovadas.",
  href:"/admin/hub-catalog",tracked:s.merchantQuotes,strategyCount:strategyCount("business"),
  checklist:["Segmento e demanda documentados","Preço por faixa e mínimo reais","Cotação e resposta comercial","Pedido e frete confirmados","Reposição consentida e coortes de recompra"]
 };
 return [store,eclipse,achadinhos,partners,business].sort((a,b)=>a.priority-b.priority||
  a.title.localeCompare(b.title));
}

export function simulateRubiOwnedMargin(input:{
 audience:number;reachPct:number;visitPct:number;purchasePct:number;
 retailPrice:number;supplierCost:number;otherCost:number;
}){
 const nums=Object.values(input);
 if(nums.some(v=>!Number.isFinite(v)||v<0) || !Number.isSafeInteger(input.audience)
  || input.audience>10000000||[input.reachPct,input.visitPct,input.purchasePct].some(v=>v>100))
  throw new Error("Premissas inválidas.");
 const reached=Math.floor(input.audience*input.reachPct/100);
 const visits=Math.floor(reached*input.visitPct/100);
 const orders=Math.floor(visits*input.purchasePct/100);
 const margin=input.retailPrice-input.supplierCost-input.otherCost;
 return {reached,visits,orders,grossRevenue:orders*input.retailPrice,
  unitContribution:margin,totalContribution:orders*margin,
  effectiveBaseConversion:input.audience===0?0:100*orders/input.audience};
}
