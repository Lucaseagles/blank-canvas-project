export type RubiProductStory={
 id?:string|undefined;product_id:string;title:string;description:string;video_url:string;
 poster_url:string|null; evidence_notes:string;rights_confirmed:boolean;position:number;
 status?:"draft"|"approved";revision?:number|undefined;
 movement_id?:string|null;approved_movement_revision?:number|null;
};
export function emptyRubiProductStory(productId:string):RubiProductStory{
 return {product_id:productId,title:"",description:"",video_url:"",poster_url:null,evidence_notes:"",rights_confirmed:false,position:0,status:"draft",movement_id:null,approved_movement_revision:null};
}
export function validRubiStoryMediaUrl(raw:string,kind:"video"|"poster"):boolean{
 try{
  const url=new URL(raw);
  if(url.protocol!=="https:"||url.username||url.password||url.hash)return false;
  if(kind==="video")return /\.(mp4|webm)$/i.test(url.pathname);
  return /\.(png|jpe?g|webp)$/i.test(url.pathname);
 }catch{return false;}
}
export function canApproveRubiProductStory(story:RubiProductStory):boolean{
 return story.title.trim().length>=3&&story.description.trim().length>=20&&
  story.rights_confirmed&&story.evidence_notes.trim().length>=12&&
  validRubiStoryMediaUrl(story.video_url,"video")&&
  (!story.poster_url||validRubiStoryMediaUrl(story.poster_url,"poster"));
}

/** A Story is visible only while pinned to the currently reviewed revision. */
export function canServeVersionedRubiStory(story:{movement_id:string|null;approved_movement_revision:number|null;status:string;rights_confirmed:boolean},movement:{id:string;product_id:string;status:string;revision:number}|null,productId:string):boolean{
 return story.status==="approved" && story.rights_confirmed && !!story.movement_id &&
   !!movement && movement.id===story.movement_id && movement.product_id===productId &&
   movement.status==="review" && Number.isInteger(story.approved_movement_revision) &&
   story.approved_movement_revision===movement.revision;
}
