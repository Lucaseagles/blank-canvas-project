import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock3, Trash2, ArrowLeft, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/history')({
  head: () => ({ meta: [{ title: 'Histórico de navegação' }, { name: 'description', content: 'Revise os produtos e vídeos que você descobriu recentemente.' }] }),
  component: HistoryPage,
});

type Item = { key: string; product?: any; video?: any; viewedAt: string; videoId?: string };
function videoIdFromMetadata(metadata: unknown) { if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') return undefined; const value = (metadata as Record<string, unknown>)['video_id']; return typeof value === 'string' ? value : undefined; }

async function getHistory(): Promise<Item[]> {
  const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return [];
  const db = supabase as any;
  const { data: hidden } = await db.from('hidden_from_recently_viewed').select('product_id,video_id').eq('user_id', auth.user.id);
  const hiddenProducts = new Set((hidden || []).map((x: any) => x.product_id).filter(Boolean)); const hiddenVideos = new Set((hidden || []).map((x: any) => x.video_id).filter(Boolean));
  const { data: events, error } = await supabase.from('analytics_events').select('id,event_type,product_id,created_at,metadata').eq('user_id', auth.user.id).in('event_type', ['PRODUCT_VIEW', 'VIDEO_START', 'VIDEO_PROGRESS']).order('created_at', { ascending: false }).limit(500);
  if (error) throw error;
  const seen = new Set<string>(); const items: Item[] = [];
  for (const event of events || []) { const videoId = videoIdFromMetadata(event.metadata); const key = videoId ? `video:${videoId}` : event.product_id ? `product:${event.product_id}` : ''; if (!key || seen.has(key) || (videoId ? hiddenVideos.has(videoId) : hiddenProducts.has(event.product_id))) continue; seen.add(key); items.push({ key, viewedAt: event.created_at, ...(videoId ? { videoId } : {}) }); }
  const productIds = items.filter(x => x.key.startsWith('product:')).map(x => x.key.slice(8)); const videoIds = items.flatMap(x => x.videoId ? [x.videoId] : []);
  if (productIds.length) { const { data } = await supabase.from('products').select('*, marketplaces(name), video_products(id)').in('id', productIds); const byId = new Map((data || []).map((p: any) => [p.id, p])); for (const item of items) if (item.key.startsWith('product:')) item.product = byId.get(item.key.slice(8)); }
  if (videoIds.length) { const { data } = await supabase.from('videos').select('id,title,video_url,storage_path,external_url,thumbnail_url,duration').in('id', videoIds); const byId = new Map((data || []).map((v: any) => [v.id, v])); for (const item of items) if (item.videoId) item.video = byId.get(item.videoId); }
  return items.filter(x => x.product || x.video);
}

function HistoryPage() {
  const queryClient = useQueryClient(); const history = useQuery({ queryKey: ['analytics-history'], queryFn: getHistory, staleTime: 30_000 });
  const remove = async (item: Item) => { const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return; const db = supabase as any; const payload = { user_id: auth.user.id, product_id: item.videoId ? null : item.product?.id ?? null, video_id: item.videoId ?? null }; const conflict = item.videoId ? 'user_id,video_id' : 'user_id,product_id'; const { error } = await db.from('hidden_from_recently_viewed').upsert(payload, { onConflict: conflict }); if (!error) await queryClient.invalidateQueries({ queryKey: ['analytics-history'] }); };
  if (history.isLoading) return <div className="container mx-auto max-w-7xl px-4 py-16"><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}</div></div>;
  if (history.error) return <div className="container mx-auto max-w-3xl px-4 py-20 text-center"><p className="text-muted-foreground">Não foi possível carregar seu histórico.</p><Button className="mt-6" onClick={() => void history.refetch()}>Tentar novamente</Button></div>;
  const items = history.data || [];
  return <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16"><div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><Button variant="ghost" size="sm" asChild className="mb-4 -ml-3"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button><div className="flex items-center gap-2 text-primary"><Clock3 className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Navegação real</span></div><h1 className="mt-2 text-4xl font-black uppercase italic tracking-tight md:text-6xl">Meu histórico</h1></div></div>{items.length === 0 ? <Card className="border-dashed border-white/10 bg-white/5 p-16 text-center"><Clock3 className="mx-auto mb-5 h-12 w-12 text-muted-foreground/40" /><h2 className="text-xl font-black uppercase">Seu histórico está vazio</h2><p className="mt-2 text-muted-foreground">Abra produtos ou vídeos e eles aparecerão aqui.</p><Button asChild className="mt-6"><Link to="/feed">Explorar ofertas</Link></Button></Card> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{items.map(item => item.product ? <Card key={item.key} className="group relative overflow-hidden border-white/10 bg-white/5"><Link to="/product/$slug" params={{ slug: item.product.slug }} className="block"><img src={item.product.images?.[0] || item.product.image || ''} alt={item.product.title} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" /><div className="p-4"><p className="line-clamp-2 text-sm font-bold">{item.product.title}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(item.viewedAt).toLocaleString('pt-BR')}</p></div></Link><Button variant="secondary" size="icon" onClick={() => void remove(item)} className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 shadow-lg backdrop-blur" aria-label={`Remover ${item.product.title} do histórico`}><Trash2 className="h-3.5 w-3.5" /></Button></Card> : <Card key={item.key} className="relative overflow-hidden border-white/10 bg-white/5 p-3"><Link to="/" className="block"><div className="aspect-video overflow-hidden rounded-xl bg-black"><img src={item.video.thumbnail_url || ''} alt={item.video.title || 'Vídeo'} className="h-full w-full object-cover" loading="lazy" /></div><div className="p-2"><div className="flex items-center gap-2"><PlayCircle className="h-4 w-4 text-primary" /><p className="line-clamp-2 text-sm font-bold">{item.video.title || 'Vídeo assistido'}</p></div><p className="mt-2 text-xs text-muted-foreground">{new Date(item.viewedAt).toLocaleString('pt-BR')}</p></div></Link><Button variant="secondary" size="sm" onClick={() => void remove(item)} className="mt-2 w-full">Remover</Button></Card>)}</div>}</div>;
}
