import { supabase } from "@/integrations/supabase/client";

export type ProductStatus = "draft" | "published" | "archived" | "active";
export interface ProductFormData { title:string; description:string|null; category_id:string|null; marketplace_id:string|null; external_product_id:string|null; affiliate_url:string; current_price:number; previous_price:number|null; discount:number|null; rating:number|null; review_count:number|null; free_shipping:boolean; status:ProductStatus; images:string[]; is_active:boolean; }

export async function getCategories(){ const {data,error}=await supabase.from("categories").select("id,name").eq("is_active",true).order("name"); if(error)throw error; return data??[]; }
export async function getMarketplaces(){ const {data,error}=await supabase.from("marketplaces").select("id,name").order("name"); if(error)throw error; return data??[]; }

function productPayload(data: Partial<ProductFormData>) {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (data.category_id !== undefined) payload.category_id = data.category_id || null;
  if (data.marketplace_id !== undefined) payload.marketplace_id = data.marketplace_id || null;
  if (data.external_product_id !== undefined) payload.external_product_id = data.external_product_id?.trim() || null;
  if (data.affiliate_url !== undefined) payload.affiliate_url = data.affiliate_url.trim();
  if (data.current_price !== undefined) payload.current_price = Number(data.current_price);
  if (data.previous_price !== undefined) payload.previous_price = data.previous_price == null ? null : Number(data.previous_price);
  if (data.discount !== undefined) payload.discount = data.discount == null ? null : Number(data.discount);
  if (data.rating !== undefined) payload.rating = data.rating == null ? null : Number(data.rating);
  if (data.review_count !== undefined) payload.review_count = data.review_count == null ? null : Number(data.review_count);
  if (data.free_shipping !== undefined) payload.free_shipping = Boolean(data.free_shipping);
  if (data.status !== undefined) payload.status = data.status;
  if (data.images !== undefined) payload.images = data.images ?? [];
  return payload;
}

export async function createProduct(data:ProductFormData){ const {data:result,error}=await supabase.from("products").insert(productPayload(data)).select().single(); if(error)return{success:false as const,error:error.message}; return{success:true as const,data:result}; }
export async function updateProduct(id:string,data:Partial<ProductFormData>){ const payload={...productPayload(data),updated_at:new Date().toISOString()}; const {data:result,error}=await supabase.from("products").update(payload).eq("id",id).select().single(); if(error)return{success:false as const,error:error.message}; return{success:true as const,data:result}; }
export async function getProduct(id:string){ const {data,error}=await supabase.from("products").select("*, categories:category_id(id,name), marketplaces:marketplace_id(id,name)").eq("id",id).single(); if(error)throw error; return data; }
export async function listProducts(options?:{limit?:number;offset?:number;status?:string;search?:string;category_id?:string}){ let query=supabase.from("products").select("*, categories:category_id(id,name), marketplaces:marketplace_id(id,name)",{count:"exact"}).order("created_at",{ascending:false}); if(options?.status&&options.status!=="all")query=query.eq("status",options.status); if(options?.category_id&&options.category_id!=="all")query=query.eq("category_id",options.category_id); if(options?.search?.trim())query=query.ilike("title",`%${options.search.trim()}%`); const limit=options?.limit??50,offset=options?.offset??0; const {data,count,error}=await query.range(offset,offset+limit-1); if(error)throw error; return{data:data??[],total:count??0}; }
export async function bulkUpdateProducts(ids:string[],updates:Partial<ProductFormData>){ if(!ids.length)return{success:false,errors:["Nenhum produto selecionado"],count:0}; const {data,error}=await supabase.from("products").update({...productPayload(updates),updated_at:new Date().toISOString()}).in("id",ids).select(); if(error)return{success:false,errors:[error.message],count:0}; return{success:true,count:data?.length??0}; }
export async function bulkDeleteProducts(ids:string[]){ if(!ids.length)return{success:false,errors:["Nenhum produto selecionado"],count:0}; const {data,error}=await supabase.from("products").delete().in("id",ids).select(); if(error)return{success:false,errors:[error.message],count:0}; return{success:true,count:data?.length??0}; }
export async function duplicateProduct(id:string){ try{ const original=await getProduct(id); if(!original)return{success:false as const,error:"Produto não encontrado"}; const payload={title:`${original.title} (cópia)`,description:original.description,category_id:original.category_id,marketplace_id:original.marketplace_id,external_product_id:original.external_product_id,affiliate_url:original.affiliate_url,current_price:original.current_price,previous_price:original.previous_price,discount:original.discount,rating:original.rating,review_count:original.review_count,free_shipping:original.free_shipping,status:"draft" as const,images:original.images??[]}; const {data,error}=await supabase.from("products").insert(payload).select().single(); if(error)throw error; return{success:true as const,data}; }catch(error:any){return{success:false as const,error:error.message};} }
