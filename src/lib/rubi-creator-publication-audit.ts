/**
 * Reconcile creator publication references with RUBI's campaign labels.
 * Campaign aggregates are NOT per-creator or per-post analytics.
 */
export type CreatorPublication={id:string;assignment_id:string;channel:string;publication_url:string;review_status:string;published_at:string};
export type CreatorAssignment={id:string;variant_id:string;status:string};
export type DistributionRecord={id:string;variant_id:string;channel:string;campaign:string;status:string;published_reference:string|null};
export type CampaignEventRow={product_id:string;channel:string;campaign:string;view_events:number;checkout_intents:number};
export type PublicationAudit={
 id:string;status:"unreviewed"|"no_distribution"|"ambiguous_distribution"|"matched_campaign"|"ambiguous_campaign";
 campaign:string|null;channel:string;viewEvents:number|null;checkoutIntents:number|null;
 explanation:string;
};
function canonicalUrl(value:string|null|undefined):string|null{
 if(!value)return null;
 try{
  const url=new URL(value);
  if(url.protocol!=="https:"||url.username||url.password||url.hash)return null;
  // Do not drop query parameters: different referral/campaign URLs are not interchangeable.
  return url.href;
 }catch{return null;}
}
export function auditRubiCreatorPublications(
 publications:CreatorPublication[],assignments:CreatorAssignment[],
 distribution:DistributionRecord[],events:CampaignEventRow[],productByVariant:Record<string,string>,
 limited:boolean
):PublicationAudit[]{
 const assignmentById=new Map(assignments.map(a=>[a.id,a]));
 const occurrence=new Map<string,number>();
 for(const d of distribution){
  const product=productByVariant[d.variant_id];
  if(!product)continue;
  const key=[product,d.channel,d.campaign].join("::");
  occurrence.set(key,(occurrence.get(key)??0)+1);
 }
 return publications.map((p):PublicationAudit=>{
  const base={id:p.id,channel:p.channel,campaign:null,viewEvents:null,checkoutIntents:null};
  if(p.review_status!=="reviewed")return {...base,status:"unreviewed",explanation:"A publicação não foi revisada como referência editorial."};
  const assignment=assignmentById.get(p.assignment_id);
  if(!assignment)return {...base,status:"no_distribution",explanation:"Associação de campanha ausente no conjunto consultado."};
  const url=canonicalUrl(p.publication_url);
  const matches=distribution.filter(d=>d.variant_id===assignment.variant_id&&d.channel===p.channel&&
   d.status==="manually_published"&&canonicalUrl(d.published_reference)===url&&url!==null);
  if(matches.length!==1)return {...base,status:matches.length?"ambiguous_distribution":"no_distribution",
   explanation:matches.length?"Mais de um registro usa a mesma referência.":"Não há referência idêntica registrada na distribuição do movimento."};
  const matched=matches[0]!;
  const product=productByVariant[matched.variant_id];
  const key=[product,matched.channel,matched.campaign].join("::");
  if(limited||!product||(occurrence.get(key)??0)!==1)return {...base,status:"ambiguous_campaign",
   explanation:limited?"Consultas limitadas: correlação omitida para evitar conclusão incompleta.":"Rótulo de campanha repetido ou produto sem correspondência única."};
  const matchingEvents=events.filter(e=>e.product_id===product&&e.channel===matched.channel&&e.campaign===matched.campaign);
  const single=matchingEvents.length===1?matchingEvents[0]:null;
  // Never display 0 when the campaign was absent from the bounded aggregate.
  return {id:p.id,channel:p.channel,campaign:matched.campaign,
   status:"matched_campaign",viewEvents:single?.view_events??null,
   checkoutIntents:single?.checkout_intents??null,
   explanation:"Correspondência de campanha, NÃO de pessoa/publicação: os eventos podem vir de outros canais ou criadores usando o mesmo rótulo. Não representa venda."};
 });
}
