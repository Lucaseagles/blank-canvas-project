import {approvedRubiCheckout,type RubiCheckoutRecord} from "./rubi-checkout-validation";

export type RubiLaunchProduct = RubiCheckoutRecord & {
 id:string;title:string;active:boolean;retail_price:number;supplier_cost:number;
 description:string|null;image_url:string|null;
};
export type RubiLaunchEditorial = {playbooks:number;approvedPlaybooks:number;movements:number;variants:number;approvedPages:number};
export type RubiLaunchAssessment = {
 productId:string; title:string; readyForRetail:boolean;
 blocking:string[];recommendations:string[];
 editorial:RubiLaunchEditorial;
 grossMarginAmount:number|null;grossMarginPercent:number|null;
};
export function assessRubiLaunch(p:RubiLaunchProduct,editorial:RubiLaunchEditorial):RubiLaunchAssessment {
 const blocking:string[]=[];
 const recommendations:string[]=[];
 const price=Number(p.retail_price),cost=Number(p.supplier_cost);
 if(!p.active)blocking.push("Produto ainda não publicado.");
 if(!p.hub_suppliers?.active)blocking.push("Fornecedor inativo ou não cadastrado.");
 if(!Number.isFinite(price)||price<=0)blocking.push("Preço de varejo inválido.");
 if(!approvedRubiCheckout(p))blocking.push("Checkout HTTPS ainda não aprovado para o domínio oficial do fornecedor.");
 if(!p.description?.trim())recommendations.push("Adicionar descrição real do produto.");
 if(!p.image_url?.trim())recommendations.push("Adicionar imagem autorizada.");
 if(editorial.approvedPlaybooks===0&&editorial.approvedPages===0)recommendations.push("Aprovar uma oferta editorial ou página de movimento.");
 if(editorial.movements===0)recommendations.push("Criar ao menos um movimento comercial para este produto.");
 if(editorial.variants===0)recommendations.push("Preparar variantes de criativos e páginas.");
 const validMargin=Number.isFinite(price)&&price>0&&Number.isFinite(cost)&&cost>=0;
 if(!validMargin)recommendations.push("Confirmar custo do fornecedor.");
 if(validMargin&&cost>=price)recommendations.push("Revisar margem bruta: custo igual ou superior ao preço.");
 const grossMarginAmount=validMargin?Math.round((price-cost)*100)/100:null;
 const grossMarginPercent=validMargin?Math.round(((price-cost)/price)*1000)/10:null;
 return {productId:p.id,title:p.title,readyForRetail:blocking.length===0,blocking,recommendations,editorial,grossMarginAmount,grossMarginPercent};
}
