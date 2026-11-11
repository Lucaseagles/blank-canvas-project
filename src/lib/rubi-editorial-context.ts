/** Local, temporary editorial context; never represents a referral or paid order. */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TTL_MS=30*60*1000;
type Context={sectionId:string;productId:string;timestamp:number};
const key=(productId:string)=>"rubi_editorial_product_"+productId;
export function validEditorialContext(value:unknown,productId:string,now:number):string|null {
 if(!UUID.test(productId)||!value||typeof value!=="object")return null;
 const item=value as Partial<Context>;
 if(typeof item.sectionId!=="string"||!UUID.test(item.sectionId)||
    item.productId!==productId||typeof item.timestamp!=="number"||
    !Number.isFinite(item.timestamp)||item.timestamp>now||
    now-item.timestamp>TTL_MS)return null;
 return item.sectionId;
}
export function rememberRubiEditorialClick(sectionId:string,productId:string):void{
 if(typeof window==="undefined"||!UUID.test(sectionId)||!UUID.test(productId))return;
 try{window.sessionStorage.setItem(key(productId),JSON.stringify({sectionId,productId,timestamp:Date.now()}));}catch{/* optional telemetry */}
}
export function getRubiEditorialSection(productId:string):string|null{
 if(typeof window==="undefined"||!UUID.test(productId))return null;
 try{
  const raw=window.sessionStorage.getItem(key(productId));
  if(!raw)return null;
  const section=validEditorialContext(JSON.parse(raw),productId,Date.now());
  if(!section)window.sessionStorage.removeItem(key(productId));
  return section;
 }catch{return null;}
}
