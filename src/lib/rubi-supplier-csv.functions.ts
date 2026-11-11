import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {parseRubiSupplierCsv} from "./rubi-supplier-csv";

/** Atomic batch insert: all products remain inactive, unverified, without checkout. */
export const importRubiSupplierDraftsAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({supplierId:z.string().uuid(),csv:z.string().min(1).max(100000)}).parse(input))
 .handler(async({data})=>{
  const preview=parseRubiSupplierCsv(data.csv);
  if(preview.headerErrors.length)throw new Error(preview.headerErrors.join(" "));
  if(!preview.rows.length)throw new Error("Nenhum produto encontrado.");
  const invalid=preview.rows.filter(row=>row.errors.length);
  if(invalid.length)throw new Error("Corrija as linhas inválidas: "+invalid.slice(0,5).map(row=>row.line).join(", ")+".");
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:supplier,error:supplierError}=await db.from("hub_suppliers")
   .select("id").eq("id",data.supplierId).maybeSingle();
  if(supplierError)throw supplierError;
  if(!supplier)throw new Error("Fornecedor não encontrado.");
  const drafts=preview.rows.map(row=>row.draft!);
  // Reject duplicate SKUs already present for this supplier. Unique constraints still govern concurrent inserts.
  const skus=drafts.map(p=>p.sku).filter(Boolean);
  if(skus.length){
   const {data:existing,error:existingError}=await db.from("hub_products")
    .select("sku").eq("supplier_id",data.supplierId).in("sku",skus).limit(50);
   if(existingError)throw existingError;
   if(existing?.length)throw new Error("Existem SKUs já cadastrados neste fornecedor. Revise antes de importar: "+existing.map((p:{sku:string})=>p.sku).join(", "));
  }
  const payload=drafts.map(p=>({
    supplier_id:data.supplierId,title:p.title,description:p.description,
    category:p.category||null,sku:p.sku||null,image_url:p.image_url||null,
    retail_price:p.retail_price,supplier_cost:p.supplier_cost,
    b2b_base_price:null,min_b2b_quantity:1,
    active:false,checkout_verified:false,checkout_url:null,
  }));
  const {error}=await db.from("hub_products").insert(payload);
  if(error)throw error;
  return {created:payload.length,published:0,checkoutVerified:0};
 });
