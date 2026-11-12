/** Deterministic feed capacity. Invalid admin config never creates negative or overflowing buckets. */
export function planRubiFeedMix(
 limit:number,
 weights:{relevant:unknown;related:unknown;discovery:unknown},
 hasVerifiedInterests:boolean
){
 const safeLimit=Number.isFinite(limit)?Math.max(0,Math.min(40,Math.floor(limit))):12;
 const valid=(value:unknown,fallback:number)=>{
  const n=Number(value);
  return Number.isFinite(n)&&n>=0?n:fallback;
 };
 const relevant=valid(weights.relevant,70);
 const related=valid(weights.related,20);
 const discovery=valid(weights.discovery,10);
 const total=relevant+related+discovery;
 const r=total>0?relevant/total:0.7;
 const rel=total>0?related/total:0.2;
 const relevantCount=hasVerifiedInterests?Math.min(safeLimit,Math.round(safeLimit*r)):0;
 const relatedCount=Math.min(safeLimit-relevantCount,Math.round(safeLimit*rel));
 const discoveryCount=safeLimit-relevantCount-relatedCount;
 return {relevantCount,relatedCount,discoveryCount};
}
