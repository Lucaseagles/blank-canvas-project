/** Bounded, non-financial landing-event observations, grouped only by validated URL tag.
 * A repeated request can create repeated events. This is NOT unique visitor analytics.
 */
export type TaggedVisit={publication_id:string|null;visited_at:string};
export type PublicationLabel={id:string;assignment_id:string;membership_id:string;channel:string;review_status:string};
export type PublicationVisitRow={id:string;assignmentId:string;membershipId:string;channel:string;taggedVisitEvents:number};
export function summarizeTaggedPublicationVisits(
 publications:PublicationLabel[],visits:TaggedVisit[],limited:boolean
):{rows:PublicationVisitRow[];limited:boolean;totalTaggedEvents:number|null}{
 if(limited)return {rows:[],limited:true,totalTaggedEvents:null};
 const counts=new Map<string,number>();
 for(const visit of visits){
  if(!visit.publication_id)continue;
  counts.set(visit.publication_id,(counts.get(visit.publication_id)??0)+1);
 }
 const rows=publications.filter(post=>post.review_status==="reviewed").map(post=>({
  id:post.id,assignmentId:post.assignment_id,membershipId:post.membership_id,
  channel:post.channel,taggedVisitEvents:counts.get(post.id)??0
 }));
 return {rows,limited:false,totalTaggedEvents:[...counts.values()].reduce((sum,value)=>sum+value,0)};
}
