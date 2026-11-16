import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {parseRubiAffiliateCsv,safeRubiAffiliateUrl} from "./rubi-affiliate-csv-parser";

type CsvError={row:number;error:string};
const decimal=(v:string)=>Number(v.replace(",","."));
const monetary=(v:number)=>Number.isFinite(v)&&v>0&&v<=1000000&&Math.abs(v*100-Math.round(v*100))<0.000001;
const optionalNumber=(v:string,min:number,max:number,integer=false):number|null=>{
 if(!v)return null;
 const n=decimal(v);
 if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))
  throw new Error("Valor numérico fora dos limites.");
 return n;
};

export const importAffiliateProductCsvAdmin=createServerFn({method:"POST"})
.middleware([requireOwnerRole])
.validator((input:unknown)=>z.object({csv:z.string().min(1).max(150000)}).parse(input))
.handler(async({data,context})=>{
 const {headers,rows}=parseRubiAffiliateCsv(data.csv);
 const errors:CsvError[]=[];
 if(rows.length<1||rows.length>100)
  return {success:false,imported:0,errors:[{row:0,error:"Envie entre 1 e 100 produtos por arquivo."}]};
 for(const h of ["name","price","affiliate_url","marketplace"]){
  if(!headers.includes(h))errors.push({row:0,error:`Falta a coluna ${h}.`});
 }
 if(errors.length)return {success:false,imported:0,errors};
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const [{data:categoryRows,error:ce},{data:marketplaceRows,error:me}]=await Promise.all([
  supabaseAdmin.from("categories").select("id,name,is_active"),
  supabaseAdmin.from("marketplaces").select("id,name,status")
 ]);
 if(ce)throw ce;if(me)throw me;
 const categories=new Map((categoryRows??[]).map(c=>[c.name.trim().toLowerCase(),c]));
 const marketplaces=new Map((marketplaceRows??[]).map(m=>[m.name.trim().toLowerCase(),m]));
 const get=(row:string[],key:string)=>row[headers.indexOf(key)]?.trim()??"";
 const products:Record<string,unknown>[]=[];
 const seen=new Set<string>();
 for(const [index,row] of rows.entries()){
  try{
   if(row.length!==headers.length)throw new Error("Quantidade de colunas divergente.");
   const name=get(row,"name"),url=get(row,"affiliate_url"),price=decimal(get(row,"price"));
   if(name.length<2||name.length>200)throw new Error("Nome deve ter entre 2 e 200 caracteres.");
   if(!monetary(price))throw new Error("Preço deve ser positivo e ter até duas casas decimais.");
   if(url.length>2048||!safeRubiAffiliateUrl(url))throw new Error("Link afiliado HTTPS externo inválido.");
   const categoryName=get(row,"category").toLowerCase();
   const marketplaceName=get(row,"marketplace").toLowerCase();
   const category=categoryName?categories.get(categoryName):null;
   const marketplace=marketplaces.get(marketplaceName);
   if(categoryName&&(!category||!category.is_active))throw new Error("Categoria ausente ou inativa.");
   if(!marketplace||marketplace.status!=="active")throw new Error("Marketplace ausente ou inativo.");
   const previous=optionalNumber(get(row,"old_price"),0.01,1000000);
   if(previous!==null&&(!monetary(previous)||previous<price))throw new Error("Preço anterior inválido.");
   const discount=optionalNumber(get(row,"discount"),0,100,true);
   const rating=optionalNumber(get(row,"rating"),0,5);
   const count=optionalNumber(get(row,"review_count"),0,10000000,true);
   const ship=get(row,"shipping").toLowerCase();
   if(ship&&ship!=="free"&&ship!=="paid")throw new Error("Frete deve ser free ou paid.");
   const key=`${name.toLowerCase()}|${url.toLowerCase()}`;
   if(seen.has(key))throw new Error("Produto duplicado no arquivo.");
   seen.add(key);
   const description=get(row,"description");
   if(description.length>5000)throw new Error("Descrição muito longa.");
   products.push({
    title:name,description:description||null,current_price:price,
    previous_price:previous,discount,rating,review_count:count,
    affiliate_url:url,category_id:category?.id??null,marketplace_id:marketplace.id,
    free_shipping:ship==="free"
   });
  }catch(error){errors.push({row:index+2,error:error instanceof Error?error.message:"Linha inválida"});}
 }
 // All-or-nothing: invalid rows prevent any product insert.
 if(errors.length)return {success:false,imported:0,errors};
 const {data:imported,error}=await (supabaseAdmin as any).rpc("rubi_import_affiliate_drafts_audited",{
  p_rows:products,p_actor:context.userId
 });
 if(error)throw new Error(error.message);
 if(Number(imported)!==products.length)throw new Error("Importação incompleta; verifique o histórico administrativo.");
 return {success:true,imported:Number(imported),errors:[] as CsvError[]};
});
