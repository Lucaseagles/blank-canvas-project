import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ExternalLink, Plus, Power, Trash2 } from 'lucide-react';

const OWNER_EMAIL = 'eaglesfr49@gmail.com';
const platforms = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'ml', label: 'Mercado Livre' },
  { value: 'youtube', label: 'YouTube' },
] as const;

export const Route = createFileRoute('/admin/bridge-videos')({ component: AdminBridgeVideosPage });

async function assertOwner() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== OWNER_EMAIL) throw new Error('Acesso restrito ao Owner.');
  const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'owner' });
  if (error || data !== true) throw new Error('Acesso restrito ao Owner.');
  return user;
}

function AdminBridgeVideosPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', subtitle: '', thumbnail: '', platform: 'tiktok', link: '', productId: '' });

  const { data: products = [] } = useQuery({
    queryKey: ['bridge-products'],
    queryFn: async () => {
      await assertOwner();
      const { data, error } = await supabase.from('products').select('id,title,current_price').eq('status', 'active').order('title');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['admin-bridge-videos'],
    queryFn: async () => {
      await assertOwner();
      const { data, error } = await supabase.from('bridge_videos').select('id,title,subtitle,thumbnail,platform,link,is_active,created_at,product_id,products(id,title,current_price)').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      await assertOwner();
      if (!form.title.trim() || !form.productId || !form.link.startsWith('https://')) throw new Error('Título, produto e URL HTTPS são obrigatórios.');
      const { error } = await supabase.from('bridge_videos').insert({
        title: form.title.trim(), subtitle: form.subtitle.trim() || null, thumbnail: form.thumbnail.trim() || null,
        platform: form.platform, link: form.link.trim(), product_id: form.productId, is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ title: '', subtitle: '', thumbnail: '', platform: 'tiktok', link: '', productId: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-bridge-videos'] });
      toast.success('Vídeo ponte cadastrado.');
    },
    onError: (error: any) => toast.error(error?.message || 'Não foi possível cadastrar o vídeo.'),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await assertOwner();
      const { error } = await supabase.from('bridge_videos').update({ is_active: !active, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bridge-videos'] }),
    onError: (error: any) => toast.error(error?.message || 'Erro ao atualizar status.'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await assertOwner();
      const { error } = await supabase.from('bridge_videos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-bridge-videos'] }); toast.success('Vídeo removido.'); },
    onError: (error: any) => toast.error(error?.message || 'Erro ao remover vídeo.'),
  });

  return (
    <main className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><Badge className="mb-2">Bridge Video</Badge><h1 className="text-4xl font-black uppercase italic tracking-tighter">Vídeos Ponte</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Curadoria de vídeos reais de plataformas externas ligados a produtos reais. Nenhum conteúdo é criado ou inventado pelo sistema.</p></div>
        <Button variant="outline" asChild><a href="/bridge-videos" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir página pública</a></Button>
      </header>

      <Card className="border-glass-border bg-white/[0.03]">
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />Cadastrar vídeo real</CardTitle></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título real do vídeo" /></div>
          <div className="space-y-2"><Label>Plataforma</Label><Select value={form.platform} onValueChange={(platform) => setForm({ ...form, platform })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{platforms.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2 md:col-span-2"><Label>URL oficial do vídeo</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." type="url" /></div>
          <div className="space-y-2"><Label>Subtítulo/legenda</Label><Textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Texto real associado ao vídeo (opcional)" /></div>
          <div className="space-y-2"><Label>Thumbnail real</Label><Input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://... (opcional)" type="url" /></div>
          <div className="space-y-2 md:col-span-2"><Label>Produto correspondente</Label><Select value={form.productId} onValueChange={(productId) => setForm({ ...form, productId })}><SelectTrigger><SelectValue placeholder="Selecione um produto real" /></SelectTrigger><SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title} — R$ {Number(p.current_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</SelectItem>)}</SelectContent></Select></div>
          <Button className="h-12 md:col-span-2" onClick={() => save.mutate()} disabled={save.isPending}><Plus className="mr-2 h-4 w-4" />{save.isPending ? 'Salvando...' : 'Salvar vídeo ponte'}</Button>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : videos.length === 0 ? <p className="rounded-2xl border border-glass-border p-6 text-sm text-muted-foreground">Nenhum vídeo ponte cadastrado ainda. Isso é esperado até o Owner cadastrar fontes reais.</p> : videos.map((video: any) => (
          <Card key={video.id} className="border-glass-border bg-white/[0.03]"><CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
            {video.thumbnail ? <img src={video.thumbnail} alt="" className="h-24 w-40 shrink-0 rounded-xl object-cover" /> : <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">Sem thumbnail real</div>}
            <div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><Badge>{video.platform}</Badge><Badge variant={video.is_active ? 'default' : 'outline'}>{video.is_active ? 'Ativo' : 'Inativo'}</Badge></div><h2 className="mt-2 font-black">{video.title}</h2><p className="text-sm text-muted-foreground">Produto: {video.products?.title || '—'}</p><a className="mt-1 block truncate text-xs text-primary hover:underline" href={video.link} target="_blank" rel="noopener noreferrer">{video.link}</a></div>
            <div className="flex gap-2"><Button variant="outline" size="icon" onClick={() => toggle.mutate({ id: video.id, active: video.is_active })} aria-label="Ativar ou desativar"><Power className="h-4 w-4" /></Button><Button variant="outline" size="icon" onClick={() => { if (window.confirm('Remover este vídeo ponte?')) remove.mutate(video.id); }} aria-label="Remover"><Trash2 className="h-4 w-4" /></Button></div>
          </CardContent></Card>
        ))}
      </section>
    </main>
  );
}
