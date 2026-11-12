import type {RubiConnectedFlowCounts} from "./rubi-connected-commercial-flow.functions";

export type RubiFlowStage={
 id:"products"|"plansApproved"|"teams"|"membersActive"|"assignmentsReady"|"publicationsSubmitted"|"publicationsReviewed";
 title:string;value:number;description:string;anchor:string;
};
export function buildRubiConnectedFlowStages(c:RubiConnectedFlowCounts):RubiFlowStage[]{
 return [
  {id:"products",title:"Produtos cadastrados",value:c.products,description:"Não comprova preço, estoque nem checkout válido",anchor:"rubi-catalog-entry"},
  {id:"plansApproved",title:"Planos de criadores aprovados",value:c.plansApproved,description:"Aprovação interna sem publicação ou gasto",anchor:"rubi-movement-entry"},
  {id:"teams",title:"Times criados",value:c.teams,description:"Times não são parceiros contratados",anchor:"rubi-team-entry"},
  {id:"membersActive",title:"Vínculos ativos nos times",value:c.membersActive,description:"Vínculos não liberam produtos ou comissões",anchor:"rubi-team-members-entry"},
  {id:"assignmentsReady",title:"Associações prontas",value:c.assignmentsReady,description:"Campanhas e variantes revisadas, não publicações",anchor:"rubi-team-campaign-entry"},
  {id:"publicationsSubmitted",title:"Publicações aguardando revisão",value:c.publicationsSubmitted,description:"URLs informadas e ainda não verificadas editorialmente",anchor:"rubi-team-publications-entry"},
  {id:"publicationsReviewed",title:"Publicações revisadas",value:c.publicationsReviewed,description:"Revisão editorial, não visualizações nem vendas",anchor:"rubi-team-publication-audit-entry"}
 ];
}
export function nextRubiConnectedFlowAction(c:RubiConnectedFlowCounts):{title:string;description:string;anchor:string}{
 if(c.products===0)return {title:"Cadastrar o primeiro produto autorizado",description:"O catálogo ainda não tem SKU. Comece pelo fornecedor e confira checkout antes de qualquer venda.",anchor:"rubi-catalog-entry"};
 if(c.plansApproved===0)return {title:"Revisar e aprovar o primeiro plano de criadores",description:"O produto existe, mas não há planejamento aprovado para o funil de influenciadores.",anchor:"rubi-movement-entry"};
 if(c.teams===0)return {title:"Montar o primeiro time por nicho",description:"A campanha foi planejada, mas a rede ainda precisa de uma equipe definida.",anchor:"rubi-team-entry"};
 if(c.membersActive===0)return {title:"Associar parceiros aprovados aos times",description:"Prospecções não são integrantes ativos. Faça a aprovação antes do vínculo.",anchor:"rubi-team-members-entry"};
 if(c.assignmentsReady===0)return {title:"Conectar time, plano e criativo revisado",description:"Exija aprovação do plano e direitos de mídia antes de marcar uma associação como pronta.",anchor:"rubi-team-campaign-entry"};
 if(c.publicationsSubmitted>0)return {title:"Revisar as referências de divulgação recebidas",description:"Conferir os links não equivale a comprovar a entrega externa ou alguma compra.",anchor:"rubi-team-publications-entry"};
 if(c.publicationsReviewed===0)return {title:"Registrar e revisar referências de divulgação",description:"A campanha pode estar pronta, mas não há publicação editorialmente revisada.",anchor:"rubi-team-publications-entry"};
 return {title:"Conferir correspondências e resultados da campanha",description:"Use os indicadores de tráfego observados, sem atribuir eventos a um criador nem contar compras sem confirmação.",anchor:"rubi-team-publication-audit-entry"};
}
