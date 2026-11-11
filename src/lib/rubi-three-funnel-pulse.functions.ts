import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";

/** Period totals from exact counts. Independent stage counts, NOT a user-cohort conversion rate. */
export const getRubiThreeFunnelPulseAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({days:z.union([z.literal(7),z.literal(30),z.literal(90)])}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const since=new Date(Date.now()-data.days*86400000).toISOString();
  const count=async(table:string,dateColumn:string,filters:(query:any)=>any= q=>q)=>{
   const q=filters(db.from(table).select("id",{head:true,count:"exact"}).gte(dateColumn,since));
   const {count:total,error}=await q;
   if(error)throw error;
   return Number(total??0);
  };
  const [productViews,checkoutIntents,merchantQuotes,merchantResponses,
   merchantReplenishments,partnerLinkVisits,partnerConfirmedSales]=await Promise.all([
   count("analytics_events","created_at",q=>q.eq("event_type","RUBI_STORE_PRODUCT_VIEW")),
   count("analytics_events","created_at",q=>q.eq("event_type","RUBI_PRECHECKOUT_CONTINUE")),
   count("hub_b2b_quote_requests","created_at"),
   count("hub_b2b_quote_requests","responded_at",q=>q.not("responded_at","is",null)),
   count("hub_b2b_quote_requests","created_at",q=>q.not("replenishment_of_quote_id","is",null)),
   count("hub_partner_referral_visits","visited_at"),
   count("hub_partner_confirmed_sales","confirmed_at")
  ]);
  return {days:data.days,asOf:new Date().toISOString(),consumer:{productViews,checkoutIntents},
   merchant:{quotes:merchantQuotes,responses:merchantResponses,replenishmentRequests:merchantReplenishments},
   partner:{linkVisits:partnerLinkVisits,confirmedSales:partnerConfirmedSales},
   definition:"Independent event and record counts in the selected date window, not a unique-user cohort or a paid conversion rate."};
 });
