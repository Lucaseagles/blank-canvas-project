import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

const DashboardInputSchema = z.object({ days: z.coerce.number().int().refine((v) => [7, 30, 90].includes(v), "days must be 7, 30 or 90").default(7) });

export const getAdminIntelligenceData = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).validator((data: unknown) => DashboardInputSchema.parse(data)).handler(async ({ data: { days } }) => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 86400000);
  const startDateISO = startDate.toISOString();
  const prevStartDate = new Date(now.getTime() - days * 2 * 86400000);
  const prevStartDateISO = prevStartDate.toISOString();
  const queries = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: 'exact', head: true }),
    supabaseAdmin.from("profiles").select("*", { count: 'exact', head: true }).gte("created_at", startDateISO),
    supabaseAdmin.from("profiles").select("*", { count: 'exact', head: true }).gte("created_at", prevStartDateISO).lt("created_at", startDateISO),
    supabaseAdmin.from("products").select("*", { count: 'exact', head: true }),
    supabaseAdmin.from("products").select("*", { count: 'exact', head: true }).eq("status", "published"),
    supabaseAdmin.from("videos").select("*", { count: 'exact', head: true }).eq("status", "published"),
    supabaseAdmin.from("favorites").select("*", { count: 'exact', head: true }).gte("created_at", startDateISO),
    supabaseAdmin.from("price_alerts").select("*", { count: 'exact', head: true }).eq("is_active", true),
    supabaseAdmin.from("analytics_events").select("*", { count: 'exact', head: true }).eq("event_type", "OUTBOUND_CLICK").gte("created_at", startDateISO),
    supabaseAdmin.from("analytics_events").select("*", { count: 'exact', head: true }).eq("event_type", "OUTBOUND_CLICK").gte("created_at", prevStartDateISO).lt("created_at", startDateISO),
    supabaseAdmin.from("analytics_events").select("*", { count: 'exact', head: true }).eq("event_type", "PRODUCT_VIEW").gte("created_at", startDateISO),
    supabaseAdmin.from("referrals" as any).select("*", { count: 'exact', head: true }).gte("created_at", startDateISO),
    supabaseAdmin.from("referral_events" as any).select("*", { count: 'exact', head: true }).eq("status", "activated").gte("created_at", startDateISO),
  ]);
  const labels = ["totalUsers", "newUsers", "prevNewUsers", "totalProducts", "publishedProducts", "publishedVideos", "totalFavorites", "activeAlerts", "periodClicks", "prevPeriodClicks", "productViews", "totalReferrals", "activatedReferrals"];
  const failed = queries.findIndex((q) => q.error);
  if (failed >= 0) throw new Error(`Dashboard query failed: ${labels[failed]}`);
  const [
    { count: totalUsers }, { count: newUsers }, { count: prevNewUsers }, { count: totalProducts },
    { count: publishedProducts }, { count: publishedVideos }, { count: totalFavorites }, { count: activeAlerts },
    { count: periodClicks }, { count: prevPeriodClicks }, { count: productViews }, { count: totalReferrals }, { count: activatedReferrals },
  ] = queries;
  const [{ data: clickHistory, error: clickHistoryError }, { data: userGrowth, error: userGrowthError }, { data: topEvents, error: topEventsError }, { data: marketplaceEvents, error: marketplaceEventsError }] = await Promise.all([
    supabaseAdmin.rpc('get_daily_clicks' as any, { start_date: startDateISO }),
    supabaseAdmin.rpc('get_daily_user_growth' as any, { start_date: startDateISO }),
    supabaseAdmin.from('analytics_events').select('metadata,event_type').eq('event_type', 'OUTBOUND_CLICK').gte('created_at', startDateISO).limit(100),
    supabaseAdmin.from('analytics_events').select('metadata,event_type').eq('event_type', 'OUTBOUND_CLICK').gte('created_at', startDateISO),
  ]);
  if (clickHistoryError || userGrowthError || topEventsError || marketplaceEventsError) throw new Error("Dashboard chart query failed");
  return {
    kpis: {
      users: { total: totalUsers ?? 0, new: newUsers ?? 0, prevNew: prevNewUsers ?? 0 },
      products: { total: totalProducts ?? 0, published: publishedProducts ?? 0 },
      videos: { published: publishedVideos ?? 0 },
      clicks: { period: periodClicks ?? 0, prevPeriod: prevPeriodClicks ?? 0 },
      favorites: { total: totalFavorites ?? 0 },
      alerts: { active: activeAlerts ?? 0 },
      ctr: productViews ? ((periodClicks ?? 0) / productViews) * 100 : 0,
      referrals: { total: totalReferrals ?? 0, activated: activatedReferrals ?? 0 },
    },
    charts: { clickHistory: clickHistory ?? [], userGrowth: userGrowth ?? [], topProducts: topEvents ?? [], marketplaceDist: marketplaceEvents ?? [] },
    timestamp: new Date().toISOString(),
  };
});

export const getAdminMetrics = createServerFn({ method:"GET" }).middleware([requireOwnerRole]).handler(async()=>{ const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const [{count:users},{count:products},{count:videos},{count:favorites},{count:alerts},{count:clicks}]=await Promise.all([supabaseAdmin.from("profiles").select("*",{count:'exact',head:true}),supabaseAdmin.from("products").select("*",{count:'exact',head:true}),supabaseAdmin.from("videos").select("*",{count:'exact',head:true}),supabaseAdmin.from("favorites").select("*",{count:'exact',head:true}),supabaseAdmin.from("price_alerts").select("*",{count:'exact',head:true}),supabaseAdmin.from("analytics_events").select("*",{count:'exact',head:true}).eq("event_type","OUTBOUND_CLICK")]); return {users:users||0,products:products||0,videos:videos||0,favorites:favorites||0,alerts:alerts||0,clicks:clicks||0,timestamp:new Date().toISOString()}; });

export const getCategoriesAdmin = createServerFn({ method:"GET" }).middleware([requireOwnerRole]).handler(async()=>{ const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const {data,error}=await supabaseAdmin.from("categories").select("*").order("display_order",{ascending:true}).order("name"); if(error)throw error; return data||[]; });

const CategorySchema = z.object({ id:z.string().optional(), name:z.string().trim().min(1), slug:z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), icon:z.string().trim().max(100).optional().nullable(), image_url:z.string().url().optional().nullable().or(z.literal("")), color:z.string().trim().max(80).optional().nullable(), parent_id:z.string().nullable().optional(), display_order:z.number().int().min(0).optional(), is_active:z.boolean().optional() });
type CategoryWrite = { id?: string; name: string; slug: string; icon?: string | null; image_url?: string | null; color?: string | null; parent_id?: string | null; display_order?: number; is_active?: boolean };
const categoriesTable = (supabaseAdmin: any) => supabaseAdmin.from("categories");
export const saveCategory = createServerFn({ method:"POST" }).middleware([requireOwnerRole]).validator((data:unknown)=>CategorySchema.parse(data) as CategoryWrite).handler(async({data})=>{ const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const {id,...raw}=data; const payload={...raw,image_url:raw.image_url||null,icon:raw.icon||null,color:raw.color||null,parent_id:raw.parent_id||null,display_order:raw.display_order??0,is_active:raw.is_active??true}; const table=categoriesTable(supabaseAdmin); const result=id?await table.update(payload).eq("id",id):await table.insert(payload); if(result.error)throw result.error; return {success:true}; });
export const reorderCategories = createServerFn({ method:"POST" }).middleware([requireOwnerRole]).validator((data:unknown)=>z.object({ids:z.array(z.string()).min(1)}).parse(data)).handler(async({data})=>{ const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const table=categoriesTable(supabaseAdmin); for(const [index,id] of data.ids.entries()){ const {error}=await table.update({display_order:index}).eq("id",id); if(error)throw error; } return {success:true}; });
export const deleteCategory = createServerFn({ method:"POST" }).middleware([requireOwnerRole]).validator((data:unknown)=>z.object({id:z.string()}).parse(data)).handler(async({data:{id}})=>{ const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const {error}=await supabaseAdmin.from("categories").delete().eq("id",id); if(error)throw error; return {success:true}; });

export const getOfferGroups = createServerFn({ method:"GET" }).middleware([requireOwnerRole]).handler(async()=>{ const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const {data,error}=await supabaseAdmin.from("offer_groups" as any).select("*").order("canonical_title"); if(error)throw error; return data||[]; });
export const getOfferGroupDetails = createServerFn({ method:"GET" }).middleware([requireOwnerRole]).validator((data:unknown)=>z.object({id:z.string().uuid()}).parse(data)).handler(async({data:{id}})=>{ const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const [{data:group,error:groupError},{data:products,error:productsError}]=await Promise.all([supabaseAdmin.from("offer_groups" as any).select("*").eq("id",id).maybeSingle(),supabaseAdmin.from("products").select("id,title,current_price,status,offer_group_id").eq("offer_group_id",id).order("title")]); if(groupError)throw groupError; if(productsError)throw productsError; if(!group)throw new Error("Oferta não encontrada."); return {group,products:products||[]}; });
export const saveOfferGroup = createServerFn({ method:"POST" }).middleware([requireOwnerRole]).validator((data:unknown)=>z.object({id:z.string().uuid().optional(),canonical_title:z.string().trim().min(1).max(200)}).parse(data)).handler(async({data,context})=>{ const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const result=data.id?await supabaseAdmin.from("offer_groups" as any).update({canonical_title:data.canonical_title,updated_at:new Date().toISOString()} as any).eq("id",data.id):await supabaseAdmin.from("offer_groups" as any).insert({canonical_title:data.canonical_title} as any).select("id").single(); if(result.error)throw result.error; const id=data.id??(result.data as any)?.id; await (supabaseAdmin as any).from("admin_audit_log").insert({actor_user_id:context.userId,actor_email:context.userEmail??null,action_type:data.id?"OFFER_GROUP_UPDATED":"OFFER_GROUP_CREATED",entity_type:"offer_groups",entity_id:id,previous_value:null,new_value:{canonical_title:data.canonical_title}}); return {success:true,id}; });
export const deleteOfferGroup = createServerFn({ method:"POST" }).middleware([requireOwnerRole]).validator((data:unknown)=>z.object({id:z.string().uuid()}).parse(data)).handler(async({data:{id},context})=>{ const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const {data:existing,error:readError}=await supabaseAdmin.from("offer_groups" as any).select("*").eq("id",id).maybeSingle(); if(readError)throw readError; if(!existing)throw new Error("Oferta não encontrada."); const {data:linked,error:linkedError}=await supabaseAdmin.from("products").select("id").eq("offer_group_id",id).limit(1); if(linkedError)throw linkedError; if((linked?.length??0)>0)throw new Error("Não é possível excluir: existem produtos vinculados. Remova o vínculo antes."); const {error}=await supabaseAdmin.from("offer_groups" as any).delete().eq("id",id); if(error)throw error; await (supabaseAdmin as any).from("admin_audit_log").insert({actor_user_id:context.userId,actor_email:context.userEmail??null,action_type:"OFFER_GROUP_DELETED",entity_type:"offer_groups",entity_id:id,previous_value:existing,new_value:null}); return {success:true}; });
export const updateProductOfferGroup = createServerFn({ method:"POST" }).middleware([requireOwnerRole]).validator((data:unknown)=>z.object({productId:z.string().uuid(),offerGroupId:z.string().uuid().nullable()}).parse(data)).handler(async({data,context})=>{ const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); const {data:product,error:productError}=await supabaseAdmin.from("products").select("id,offer_group_id").eq("id",data.productId).maybeSingle(); if(productError)throw productError; if(!product)throw new Error("Produto não encontrado."); const {error}=await supabaseAdmin.from("products").update({offer_group_id:data.offerGroupId} as any).eq("id",data.productId); if(error)throw error; await (supabaseAdmin as any).from("admin_audit_log").insert({actor_user_id:context.userId,actor_email:context.userEmail??null,action_type:"PRODUCT_OFFER_GROUP_CHANGED",entity_type:"products",entity_id:data.productId,previous_value:{offer_group_id:product.offer_group_id},new_value:{offer_group_id:data.offerGroupId}}); return {success:true}; });
