import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {parseRubiSupplierCsv} from "./rubi-supplier-csv";

/** Atomic batch insert: all products remain inactive, unverified, without checkout. */
export const importRubiSupplierDraftsAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({supplierId:z.string().uuid(),csv:z.string().min(1).max(100000)}).parse(input))
 .handler(async({data,context})=>{
  const preview=parseRubiSupplierCsv(data.csv);
  if(preview.headerErrors.length)throw new Error(preview.headerErrors.join(" "));
  if(!preview.rows.length)throw new Error("Nenhum produto encontrado.");
  const invalid=preview.rows.filter(row=>row.errors.length);
  if(invalid.length)throw new Error("Corrija as linhas inválidas: "+invalid.slice(0,5).map(row=>row.line).join(", ")+".");
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const payload=preview.rows.map(row=>row.draft!);
  const {data:created,error}=await (supabaseAdmin as any).rpc("rubi_import_supplier_drafts_audited",{
   p_supplier_id:data.supplierId,p_rows:payload,p_actor:context.userId
  });
  if(error)throw new Error(error.message);
  if(Number(created)!==payload.length)throw new Error("Importação e auditoria não concluídas integralmente.");
  return {created:payload.length,published:0,checkoutVerified:0};
 });
