import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";

export type RubiVideoRetentionRow={
 variantId:string;videoId:string;videoTitle:string;
 startUsers:number;completeUsers:number;completionPercent:number|null;
};
export function rubiVideoCompletionPercent(starts:number,completes:number):number|null{
 if(!Number.isInteger(starts)||!Number.isInteger(completes)||starts<=0||completes<0||completes>starts)return null;
 return Math.round(completes/starts*1000)/10;
}
export const getRubiVariantVideoRetentionAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({movementId:z.string().uuid()}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any)
   .rpc("rubi_variant_video_retention",{p_movement_id:data.movementId,p_days:30,p_limit:100});
  if(error)throw error;
  const raw=(rows??[]) as Array<{variant_id:string;video_id:string;video_title:string;start_users:number|string;complete_users:number|string}>;
  const partial=raw.length>=100;
  const result:RubiVideoRetentionRow[]=raw.map(x=>{
   const startUsers=Number(x.start_users),completeUsers=Number(x.complete_users);
   return {variantId:x.variant_id,videoId:x.video_id,videoTitle:x.video_title,
    startUsers,completeUsers,completionPercent:partial?null:rubiVideoCompletionPercent(startUsers,completeUsers)};
  });
  return {rows:result,partial,days:30,
   disclaimer:"Eventos de usuários autenticados, não audiência total, atenção real, venda confirmada ou experimento causal."};
 });
