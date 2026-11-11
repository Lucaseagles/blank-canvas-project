import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Public aggregate of observed product events only; never buyers, checkouts completed or unique people. */
export const getRubiStoreActivityProof = createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({productId:z.string().uuid()}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:config,error:configError}=await supabaseAdmin.from("social_proof_config")
   .select("is_enabled,show_aggregated_counters,min_events_for_counter,counter_window_hours").single();
  if(configError||!config?.is_enabled||!config.show_aggregated_counters)return null;
  const windowHours=Math.min(168,Math.max(1,Number(config.counter_window_hours)||24));
  const minEvents=Math.max(2,Number(config.min_events_for_counter)||2);
  const start=new Date(Date.now()-windowHours*3600000).toISOString();
  const {data:product,error:productError}=await (supabaseAdmin as any).from("hub_products")
   .select("id,active").eq("id",data.productId).eq("active",true).maybeSingle();
  if(productError||!product)return null;
  const [views,intents]=await Promise.all([
   supabaseAdmin.from("analytics_events").select("id",{head:true,count:"exact"})
    .eq("event_type","RUBI_STORE_PRODUCT_VIEW").eq("product_id",data.productId).gte("created_at",start),
   supabaseAdmin.from("analytics_events").select("id",{head:true,count:"exact"})
    .eq("event_type","RUBI_PRECHECKOUT_CONTINUE").eq("product_id",data.productId).gte("created_at",start),
  ]);
  if(views.error||intents.error)return null;
  const viewEvents=Number(views.count??0),checkoutIntentEvents=Number(intents.count??0);
  if(viewEvents<minEvents&&checkoutIntentEvents<minEvents)return null;
  return {viewEvents:viewEvents>=minEvents?viewEvents:0,
   checkoutIntentEvents:checkoutIntentEvents>=minEvents?checkoutIntentEvents:0,windowHours};
 });
