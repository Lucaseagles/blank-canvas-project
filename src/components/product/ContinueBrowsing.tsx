import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock3, Trash2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { useEffect, useState } from "react";

type RecentItem = { key: string; product?: any; video?: any; viewedAt: string; videoId?: string };

async function getRecent(limit = 8): Promise<RecentItem[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data: hidden } = await supabase.from("hidden_from_recently_viewed").select("product_id, video_id").eq("user_id", auth.user.id);
  const hiddenProducts = new Set((hidden || []).map((x: any) => x.product_id).filter(Boolean));
  const hiddenVideos = new Set((hidden || []).map((x: any) => x.video_id).filter(Boolean));
  const { data: events, error } = await supabase.from("analytics_events")
    .select("id,event_type,product_id,created_at,metadata")
    .eq("user_id", auth.user.id)
    .in("event_type", ["PRODUCT_VIEW", "VIDEO_START", "VIDEO_PROGRESS"])
    .order("created_at", { ascending: false }).limit(Math.max(limit * 8, 80));
  if (error) throw error;
  const seen = new Set<string>();
  const result: RecentItem[] = [];
  for (const event of events || []) {
    const videoId = event.metadata?.video_id as string | undefined;
    const key = videoId ? `video:${videoId}` : event.product_id ? `product:${event.product_id}` : "";
    if (!key || seen.has(key) || (videoId ? hiddenVideos.has(videoId) : hiddenProducts.has(event.product_id))) continue;
    seen.add(key); result.push({ key, viewedAt: event.created_at, product: undefined, videoId });
    if (result.length >= limit) break;
  }
  const productIds = result.filter(x => x.key.startsWith("product:")).map(x => x.key.slice(8));
  if (productIds.length) {
    const { data } = await supabase.from("products").select("*, marketplaces(name), video_products(id)").in("id", productIds);
    const byId = new Map((data || []).map((p: any) => [p.id, p]));
    for (const item of result) if (item.key.startsWith("product:")) item.product = byId.get(item.key.slice(8));
  }
  const videoIds = result.filter(x => x.videoId).map(x => x.videoId!);
  if (videoIds.length) {
    const { data } = await supabase.from("videos").select("id,title,video_url,storage_path,external_url,thumbnail_url,duration").in("id", videoIds);
    const byId = new Map((data || []).map((v: any) => [v.id, v]));
    for (const item of result) if (item.videoId) item.video = byId.get(item.videoId);
  }
  return result.filter(x => x.product || x.video);
}

function toCardProduct(product: any) { return { id: product.id, slug: product.slug || "", categoryId: product.category_id, title: product.title, price: product.current_price ?? product.price ?? 0, previousPrice: product.previous_price, discount: product.discount, image: product.images?.[0] || product.image || "", marketplace: product.marketplaces?.name || product.marketplace || "Marketplace", rating: product.rating, reviewCount: product.review_count, affiliateUrl: product.affiliate_url || null, hasVideo: Boolean(product.video_products?.length), isBestOffer: product.is_best_offer, offerScore: product.offer_score }; }

export function ContinueBrowsing({ limit = 8, compact = false }: { limit?: number; compact?: boolean }) {
  const queryClient = useQueryClient(); const [visible, setVisible] = useState(true);
  const recent = useQuery({ queryKey: ["recently-viewed", limit], queryFn: () => getRecent(limit), staleTime: 30_000 });
  useEffect(() => { let active = true; void supabase.auth.getUser().then(({ data }) => { if (active) setVisible(Boolean(data.user)); }); return () => { active = false; }; }, []);
  const items = recent.data || [];
  if (!visible || recent.isLoading || !items.length) return null;
  const hide = async (item: RecentItem) => { const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return; const payload = item.videoId ? { user_id: auth.user.id, video_id: item.videoId } : { user_id: auth.user.id, product_id: item.product.id }; const { error } = await supabase.from("hidden_from_recently_viewed").upsert(payload, { onConflict: item.videoId ? "user_id,video_id" : "user_id,product_id" }); if (!error) await queryClient.invalidateQueries({ queryKey: ["recently-viewed"] }); };
  return <section className={compact ? "py-8" : "py-16"} aria-labelledby="continue-browsing-title"><div className="mx-auto w-full max-w-7xl px-4"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-primary"><Clock3 className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Seu histórico real</span></div><h2 id="continue-browsing-title" className="text-3xl font-black uppercase italic tracking-tight md:text-5xl">Continue de onde parou</h2></div><Button variant="ghost" size="sm" asChild className="font-black uppercase tracking-widest text-[10px]"><Link to="/history">Ver histórico <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div><div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">{items.map(item => item.product ? <div key={item.key} className="relative min-w-0"><ProductCard {...toCardProduct(item.product)} /><Button variant="secondary" size="icon" onClick={() => void hide(item)} className="absolute right-2 top-2 z-20 h-8 w-8 rounded-full bg-background/80 shadow-lg backdrop-blur" aria-label={`Remover ${item.product.title} do histórico`}><Trash2 className="h-3.5 w-3.5" /></Button></div> : <div key={item.key} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4"><div className="aspect-video overflow-hidden rounded-xl bg-black"><img src={item.video.thumbnail_url || ""} alt={item.video.title || "Vídeo"} className="h-full w-full object-cover" loading="lazy" /></div><p className="mt-3 line-clamp-2 text-sm font-bold">{item.video.title || "Vídeo assistido"}</p><Button variant="secondary" size="sm" onClick={() => void hide(item)} className="mt-3 w-full">Remover</Button></div>)}</div></div></section>;
}
