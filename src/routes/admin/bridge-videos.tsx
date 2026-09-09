import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { getAdminBridgeVideos, saveBridgeVideo, deleteBridgeVideo } from '@/lib/bridge-video.functions';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/bridge-videos')({ component: AdminBridgeVideosPage });

type FormState = { id?: string; product_id: string; title: string; subtitle: string; thumbnail: string; platform: 'tiktok'|'shopee'|'ml'|'youtube'; link: string; is_active: boolean };
const emptyForm: FormState = { product_id: '', title: '', subtitle: '', thumbnail: '', platform: 'tiktok', link: '', is_active: true };

function AdminBridgeVideosPage() {
  const queryClient = useQueryClient();
  const getFn = useServerFn(getAdminBridgeVideos);
  const saveFn = useServerFn(saveBridgeVideo);
  const deleteFn = useServerFn(deleteBridgeVideo);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { data: videos = [], isLoading, isError } = useQuery({ queryKey: ['admin-bridge-videos'], queryFn: () => getFn() });
  const { data: products = [] } = useQuery({ queryKey: ['admin-bridge-products'], queryFn: async () => { const { data, error } = await supabase.from('products').select('id,title,status').eq('status','active').order('title'); if (error) throw error; return data ?? []; } });
  const mutation = useMutation({ mutationFn: async (id: string) => deleteFn({ data: { id } }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-bridge-videos'] }); toast.success('Vídeo ponte excluído.'); } });

  const submit = async () => {
    if (!form.product_id || !form.title.trim() || !form.link.trim()) { toast.error('Produto, título e link são obrigatórios.'); return; }
    setSaving(true);
    try { await saveFn({ data: { ...form, subtitle: form.subtitle || null, thumbnail: form.thumbnail || null } }); await queryClient.invalidateQueries({ queryKey: ['admin-bridge-videos'] }); setOpen(false); setForm(emptyForm); toast.success('Vídeo ponte salvo.'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); } finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black">Video Bridge</h1><p className="text-sm text-muted-foreground">Associe vídeos externos reais aos produtos.</p></div><Button onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="mr-2 h-4 w-4"/>Novo vídeo</Button></div>
    {isLoading && <div className="py-12 text-center text-muted-foreground">Carregando vídeos...</div>}
    {isError && <Card><CardContent className="py-10 text-center text-destructive">Não foi possível carregar os vídeos ponte.</CardContent></Card>}
    {!isLoading && !isError && videos.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum vídeo ponte cadastrado.</CardContent></Card>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{videos.map((video: any) => <Card key={video.id} className="overflow-hidden"><div className="aspect-video bg-muted">{video.thumbnail ? <img src={video.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy"/> : <div className="flex h-full items-center justify-center text-muted-foreground">Sem thumbnail</div>}</div><CardContent className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><div><h2 className="font-bold line-clamp-2">{video.title}</h2><p className="text-xs text-muted-foreground">{video.products?.title ?? 'Produto removido'}</p></div><Badge variant={video.is_active ? 'default' : 'secondary'}>{video.is_active ? 'Ativo' : 'Inativo'}</Badge></div><p className="text-xs text-muted-foreground">{video.platform}</p><div className="grid grid-cols-3 gap-2"><Button variant="outline" size="sm" onClick={() => { setForm({ id: video.id, product_id: video.product_id, title: video.title, subtitle: video.subtitle ?? '', thumbnail: video.thumbnail ?? '', platform: video.platform, link: video.link, is_active: video.is_active }); setOpen(true); }}><Pencil className="h-4 w-4"/></Button><Button variant="outline" size="sm" onClick={() => window.open(video.link, '_blank', 'noopener,noreferrer')}><ExternalLink className="h-4 w-4"/></Button><Button variant="destructive" size="sm" disabled={mutation.isPending} onClick={() => { if (window.confirm('Excluir este vídeo ponte?')) mutation.mutate(video.id); }}><Trash2 className="h-4 w-4"/></Button></div></CardContent></Card>)}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{form.id ? 'Editar vídeo ponte' : 'Novo vídeo ponte'}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Produto</Label><Select value={form.product_id} onValueChange={v => setForm(f => ({...f, product_id:v}))}><SelectTrigger><SelectValue placeholder="Selecione um produto"/></SelectTrigger><SelectContent>{products.map((p: any)=><SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div><div><Label>Título</Label><Input value={form.title} maxLength={200} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div><div><Label>Subtítulo</Label><Textarea value={form.subtitle} maxLength={500} onChange={e=>setForm(f=>({...f,subtitle:e.target.value}))}/></div><div><Label>Thumbnail (URL)</Label><Input type="url" value={form.thumbnail} onChange={e=>setForm(f=>({...f,thumbnail:e.target.value}))}/></div><div><Label>Plataforma</Label><Select value={form.platform} onValueChange={(v: FormState['platform'])=>setForm(f=>({...f,platform:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="tiktok">TikTok</SelectItem><SelectItem value="shopee">Shopee</SelectItem><SelectItem value="ml">Mercado Livre</SelectItem><SelectItem value="youtube">YouTube</SelectItem></SelectContent></Select></div><div><Label>Link externo</Label><Input type="url" value={form.link} onChange={e=>setForm(f=>({...f,link:e.target.value}))}/></div><div className="flex items-center justify-between rounded-lg border p-3"><Label>Ativo</Label><Switch checked={form.is_active} onCheckedChange={v=>setForm(f=>({...f,is_active:v}))}/></div><Button className="w-full" disabled={saving} onClick={submit}>{saving ? 'Salvando...' : 'Salvar vídeo ponte'}</Button></div></DialogContent></Dialog>
  </div>;
}
