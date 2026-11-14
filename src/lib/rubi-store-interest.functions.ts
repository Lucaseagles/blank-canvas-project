import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import type {RubiInterestCategory} from "./rubi-unified-interest-ranking";

/** Only the verified account's explicitly selected categories, never behavioral/sensitive inference. */
export const getRubiStoreInterestCategories=createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({accessToken:z.string().min(20).max(8192).nullable()}).parse(input))
 .handler(async({data}):Promise<RubiInterestCategory[]>=>{
  if(!data.accessToken)return [];
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:user,error:identityError}=await supabaseAdmin.auth.getUser(data.accessToken);
  if(identityError||!user.user?.id)throw new Error("Sessão expirada. Veja a vitrine geral.");
  const db=supabaseAdmin as any;
  const {data:preferences,error:prefError}=await db.from("user_preferences")
   .select("preferred_categories").eq("user_id",user.user.id).maybeSingle();
  if(prefError)throw prefError;
  const ids=Array.isArray(preferences?.preferred_categories)?
   [...new Set((preferences.preferred_categories as unknown[]).filter(
    (id):id is string=>typeof id==="string"&&z.string().uuid().safeParse(id).success))].slice(0,20):[];
  if(!ids.length)return [];
  const {data:categories,error:categoriesError}=await db.from("categories")
   .select("id,name,slug").in("id",ids).eq("is_active",true);
  if(categoriesError)throw categoriesError;
  return (categories??[]).filter((item:any)=>typeof item.name==="string").map((item:any)=>({
   name:String(item.name),slug:typeof item.slug==="string"?item.slug:null,score:1
  }));
 });
