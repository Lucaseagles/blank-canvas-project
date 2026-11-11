export const RUBI_LAUNCH_QA_ITEMS=[
 {key:"domain",label:"Domínio e HTTPS",instructions:"Conferir o domínio da loja, HTTPS e abertura da página pública."},
 {key:"desktop",label:"Navegação desktop",instructions:"Testar páginas, criativos, preços, CTA e retorno sem efetuar pagamento."},
 {key:"mobile",label:"Navegação mobile",instructions:"Testar visualização, velocidade percebida, CTA e precheckout no celular."},
 {key:"supplier",label:"Checkout oficial e autorização",instructions:"Conferir URL e autorização do fornecedor; não efetuar cobrança não autorizada."},
 {key:"terms",label:"Condições comerciais",instructions:"Confirmar com o fornecedor preços, comissão, frete, política de estorno e prazos."},
] as const;
export type RubiQaKey=typeof RUBI_LAUNCH_QA_ITEMS[number]["key"];
export type RubiQaStatus="pending"|"verified"|"blocked";
export type RubiQaItem={status:RubiQaStatus;evidence:string};
export type RubiQaChecklist={product_id:string}&Record<RubiQaKey,RubiQaItem>;
export function emptyRubiQaChecklist(productId:string):RubiQaChecklist{
 return {product_id:productId,domain:{status:"pending",evidence:""},desktop:{status:"pending",evidence:""},
 mobile:{status:"pending",evidence:""},supplier:{status:"pending",evidence:""},terms:{status:"pending",evidence:""}};
}
export function rubiQaReview(checklist:RubiQaChecklist){
 const invalid=RUBI_LAUNCH_QA_ITEMS.filter(item=>checklist[item.key].status==="verified"&&checklist[item.key].evidence.trim().length<8).map(item=>item.label);
 const verified=RUBI_LAUNCH_QA_ITEMS.filter(item=>checklist[item.key].status==="verified").length;
 const blocked=RUBI_LAUNCH_QA_ITEMS.filter(item=>checklist[item.key].status==="blocked").map(item=>item.label);
 return {invalid,verified,total:RUBI_LAUNCH_QA_ITEMS.length,blocked,allAttested:verified===RUBI_LAUNCH_QA_ITEMS.length&&invalid.length===0};
}
