export type RubiProductStory={
 id?:string|undefined;product_id:string;title:string;description:string;video_url:string;
 poster_url:string|null; evidence_notes:string;rights_confirmed:boolean;position:number;
 status?:"draft"|"approved";revision?:number|undefined;
};
export function emptyRubiProductStory(productId:string):RubiProductStory{
 return {product_id:productId,title:"",description:"",video_url:"",poster_url:null,evidence_notes:"",rights_confirmed:false,position:0,status:"draft"};
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
