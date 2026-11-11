export type RubiMovementVariant = {
 id?:string | undefined;
 movement_id:string;
 name:string;
 format:"short_video"|"story"|"carousel"|"post";
 creative_hook:string;
 creative_script:string;
 page_headline:string;
 page_body:string;
 call_to_action:string;
 media_notes:string;
 proof_notes:string;
 media_rights_confirmed:boolean;
 status:"draft"|"review";
 revision?:number | undefined;
};
export function emptyRubiMovementVariant(movementId:string):RubiMovementVariant {
 return {movement_id:movementId,name:"",format:"short_video",creative_hook:"",creative_script:"",page_headline:"",page_body:"",call_to_action:"",media_notes:"",proof_notes:"",media_rights_confirmed:false,status:"draft"};
}
export function rubiVariantChecklist(v:RubiMovementVariant){
 const tests:[string,boolean][]=[
  ["Identificação",v.name.trim().length>=3],
  ["Gancho",v.creative_hook.trim().length>=8],
  ["Roteiro",v.creative_script.trim().length>=20],
  ["Título da página",v.page_headline.trim().length>=8],
  ["Conteúdo da página",v.page_body.trim().length>=20],
  ["Chamada para ação",v.call_to_action.trim().length>=5],
  ["Comprovação das alegações",v.proof_notes.trim().length>=12],
  ["Direitos das mídias",v.media_rights_confirmed]
 ];
 return {complete:tests.filter(([,ok])=>ok).length,total:tests.length,missing:tests.filter(([,ok])=>!ok).map(([name])=>name)};
}
export const canReviewRubiVariant=(v:RubiMovementVariant)=>rubiVariantChecklist(v).missing.length===0;
