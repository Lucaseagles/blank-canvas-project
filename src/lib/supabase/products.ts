import { supabase } from "@/integrations/supabase/client";

export type ProductStatus = "draft" | "published" | "archived" | "active";
export interface ProductFormData { title:string; description:string|null; category_id:string|null; marketplace_id:string|null; external_product_id:string|null; affiliate_url:string; current_price:number; previous_price:number|null; discount:number|null; rating:number|null; review_count:number|null; free_shipping:boolean; status:ProductStatus; images:string[]; is_active:boolean; }

export async function getCategories(){ const {data,error}=await supabase.from("categories").select("id,name").eq("is_active",true).order("name"); if(error)throw error; return data??[]; }
export async function getMarketplaces(){ const {data,error}=await supabase.from("marketplaces").select("id,name").order("name"); if(error)throw error; return data??[]; }

export async function getProduct(id:string){ const {data,error}=await supabase.from("products").select("*, categories:category_id(id,name), marketplaces:marketplace_id(id,name)").eq("id",id).single(); if(error)throw error; return data; }
export async function listProducts(options?:{limit?:number;offset?:number;status?:string;search?:string;category_id?:string}){ let query=supabase.from("products").select("*, categories:category_id(id,name), marketplaces:marketplace_id(id,name)",{count:"exact"}).order("created_at",{ascending:false}); if(options?.status&&options.status!=="all")query=query.eq("status",options.status); if(options?.category_id&&options.category_id!=="all")query=query.eq("category_id",options.category_id); if(options?.search?.trim())query=query.ilike("title",`%${options.search.trim()}%`); const limit=Math.min(Math.max(options?.limit??50,1),100);const offset=Math.max(options?.offset??0,0); const {data,count,error}=await query.range(offset,offset+limit-1); if(error)throw error; return{data:data??[],total:count??0}; }


