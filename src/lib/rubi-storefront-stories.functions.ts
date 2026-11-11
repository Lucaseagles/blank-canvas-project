import {createServerFn} from "@tanstack/react-start";
import {approvedRubiCheckout} from "./rubi-checkout-validation";
import {validRubiStoryMediaUrl} from "./rubi-product-stories";

export type RubiStoryDiscoveryItem={
 id:string;productId:string;productTitle:string;title:string;description:string;
 videoUrl:string;posterUrl:string|null;retailPrice:number;
};
/** Public discovery never fetches unpublished products, private evidence or supplier costs. */
export const getRubiStorefrontStories=createServerFn({method:"GET"}).handler(async()=>{
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const db=supabaseAdmin as any;
 const {data:stories,error:storyError}=await db.from("rubi_product_stories")
  .select("id,product_id,title,description,video_url,poster_url,position")
  .eq("status","approved").eq("rights_confirmed",true)
  .order("updated_at",{ascending:false}).limit(60);
 if(storyError)throw storyError;
 const candidates=(stories??[]).filter((story:{video_url:string;poster_url:string|null})=>
  validRubiStoryMediaUrl(story.video_url,"video")&&
  (!story.poster_url||validRubiStoryMediaUrl(story.poster_url,"poster"))
 );
 const ids=[...new Set(candidates.map((s:{product_id:string})=>s.product_id))];
 if(!ids.length)return [] as RubiStoryDiscoveryItem[];
 const {data:products,error:productError}=await db.from("hub_products")
  .select("id,title,retail_price,active,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
  .in("id",ids).eq("active",true).eq("checkout_verified",true)
  .eq("hub_suppliers.active",true).gt("retail_price",0);
 if(productError)throw productError;
 const publicProducts=new Map<string,any>((products??[])
  .filter((p:any)=>approvedRubiCheckout(p))
  .map((p:any)=>[p.id,p]));
 const picked=new Set<string>();
 const result:RubiStoryDiscoveryItem[]=[];
 for(const story of candidates){
  const product=publicProducts.get(story.product_id);
  if(!product||picked.has(story.product_id))continue;
  picked.add(story.product_id);
  result.push({
   id:story.id,productId:story.product_id,productTitle:product.title,
   title:story.title,description:story.description,videoUrl:story.video_url,
   posterUrl:story.poster_url,retailPrice:Number(product.retail_price),
  });
  if(result.length>=8)break;
 }
 return result;
});
