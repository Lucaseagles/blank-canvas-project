import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, Link2, Video, Search, Play, Layers3, CheckCircle2, XCircle } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { getAdminBridgeVideos, getAdminBridgeProducts, saveBridgeVideo, deleteBridgeVideo } from '@/lib/bridge-video.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/bridge-videos')({ component: AdminBridgeVideosPage });

type Platform = 'tiktok' | 'shopee' | 'ml' | 'youtube';
type FormState = {
  id?: string;
  product_id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  platform: Platform;
  link: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  product_id: '',
  title: '',
  subtitle: '',
  thumbnail: '',
  platform: 'tiktok',
  link: '',
  is_active: true,
};

const platformLabel: Record<Platform, string> = {
  tiktok: 'TikTok',
  shopee: 'Shopee',
  ml: 'Mercado Livre',
  youtube: 'YouTube',
};

const platformTone: Record<Platform, string> = {
  tiktok: 'bg-foreground/10 text-foreground',
  shopee: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  ml: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  youtube: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

function AdminBridgeVideosPage() {
  const queryClient = useQueryClient();
  const getFn = useServerFn(getAdminBridgeVideos);
  const getProductsFn = useServerFn(getAdminBridgeProducts);
  const saveFn = useServerFn(saveBridgeVideo);
  const deleteFn = useServerFn(deleteBridgeVideo);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: videos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-bridge-videos'],
    queryFn: () => getFn(),
  });

  const { data: products = [], isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ['admin-bridge-products'],
    queryFn: () => getProductsFn(),
  });

  const mutation = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bridge-videos'] });
      toast.success('Vídeo ponte excluído.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Não foi possível excluir o vídeo.'),
  });

  const stats = useMemo(() => ({
    total: videos.length,
    active: videos.filter((v: any) => v.is_active).length,
    inactive: videos.filter((v: any) => !v.is_active).length,
  }), [videos]);

  const filteredVideos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return videos.filter((video: any) => {
      const matchesFilter = filter === 'all' || (filter === 'active' ? video.is_active : !video.is_active);
      const matchesSearch = !term || [video.title, video.subtitle, video.products?.title, platformLabel[video.platform as Platform]]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [videos, search, filter]);

  const openCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (video: any) => {
    setForm({
      id: video.id,
      product_id: video.product_id,
      title: video.title ?? '',
      subtitle: video.subtitle ?? '',
      thumbnail: video.thumbnail ?? '',
      platform: video.platform,
      link: video.link ?? '',
      is_active: Boolean(video.is_active),
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.product_id || !form.title.trim() || !form.link.trim()) {
      toast.error('Produto, título e link são obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      await saveFn({
        data: {
          ...form,
          subtitle: form.subtitle.trim() || null,
          thumbnail: form.thumbnail.trim() || null,
          title: form.title.trim(),
          link: form.link.trim(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-bridge-videos'] });
      setOpen(false);
      setForm(emptyForm);
      toast.success(form.id ? 'Vídeo ponte atualizado.' : 'Vídeo ponte criado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o vídeo ponte.');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find((product: any) => product.id === form.product_id);
  const hasThumbnail = Boolean(form.thumbnail.trim());

  return (
    <div className="relative min-h-full overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/[0.07] via-primary/[0.025] to-transparent" />

      <div className="relative space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
          <div className="relative p-6 sm:p-8">
            <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  <Video className="h-3.5 w-3.5" />
                  Conteúdo externo
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Vídeos Ponte</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Gerencie vídeos externos reais conectados aos produtos do catálogo, com controle de plataforma, mídia e publicação.
                </p>
              </div>
              <Button onClick={openCreate} className="h-12 rounded-xl px-5 font-black shadow-lg shadow-primary/10">
                <Plus className="mr-2 h-4 w-4" /> Novo vídeo ponte
              </Button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Total', value: stats.total, icon: Layers3 },
                { label: 'Ativos', value: stats.active, icon: CheckCircle2 },
                { label: 'Inativos', value: stats.inactive, icon: XCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">{label}</span>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-xl md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por vídeo, produto ou plataforma..." className="h-11 border-0 bg-background/70 pl-9 shadow-none focus-visible:ring-1" />
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1 md:w-auto">
            {(['all', 'active', 'inactive'] as const).map((value) => (
              <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-4 py-2 text-xs font-black transition ${filter === value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {value === 'all' ? 'Todos' : value === 'active' ? 'Ativos' : 'Inativos'}
              </button>
            ))}
          </div>
        </section>

        {isLoading && <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-[330px] animate-pulse rounded-3xl border border-border/60 bg-muted/40" />)}</div>}

        {isError && (
          <Card className="rounded-3xl border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <XCircle className="h-8 w-8 text-destructive" />
              <p className="font-bold">Não foi possível carregar os vídeos ponte.</p>
              <Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && filteredVideos.length === 0 && (
          <Card className="rounded-3xl border-dashed bg-card/60">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Video className="h-7 w-7" /></div>
              <h2 className="text-lg font-black">{videos.length ? 'Nenhum resultado encontrado' : 'Nenhum vídeo ponte cadastrado'}</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{videos.length ? 'Tente outra busca ou altere o filtro de status.' : 'Crie o primeiro vídeo externo e conecte-o a um produto real.'}</p>
              {!videos.length && <Button onClick={openCreate} className="mt-5 rounded-xl font-black"><Plus className="mr-2 h-4 w-4" /> Criar vídeo ponte</Button>}
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && filteredVideos.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredVideos.map((video: any) => (
              <Card key={video.id} className="group overflow-hidden rounded-3xl border-border/60 bg-card/80 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {video.thumbnail ? <img src={video.thumbnail} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"><Video className="h-8 w-8 opacity-40" /><span className="text-xs font-bold">Sem thumbnail</span></div>}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
                    <Badge className={`border-0 font-black ${platformTone[video.platform as Platform] ?? 'bg-muted text-foreground'}`}>{platformLabel[video.platform as Platform] ?? video.platform}</Badge>
                    <Badge variant={video.is_active ? 'default' : 'secondary'} className="font-black shadow-sm">{video.is_active ? 'Ativo' : 'Inativo'}</Badge>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <button type="button" onClick={() => window.open(video.link, '_blank', 'noopener,noreferrer')} className="absolute bottom-3 left-3 flex h-10 items-center gap-2 rounded-xl bg-background/90 px-3 text-xs font-black opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100"><Play className="h-3.5 w-3.5" /> Abrir vídeo</button>
                </div>

                <CardContent className="space-y-4 p-5">
                  <div className="min-w-0"><h2 className="line-clamp-2 text-base font-black leading-snug">{video.title}</h2><p className="mt-1 line-clamp-1 text-xs font-semibold text-muted-foreground">{video.products?.title ?? 'Produto removido'}</p></div>
                  {video.subtitle && <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{video.subtitle}</p>}
                  <Separator />
                  <div className="flex items-center justify-between gap-2"><span className="inline-flex min-w-0 items-center gap-2 text-xs font-bold text-muted-foreground"><Link2 className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{video.link}</span></span></div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => openEdit(video)} aria-label="Editar vídeo"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => window.open(video.link, '_blank', 'noopener,noreferrer')} aria-label="Abrir link"><ExternalLink className="h-4 w-4" /></Button>
                    <Button variant="outline" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={mutation.isPending} onClick={() => { if (window.confirm('Excluir este vídeo ponte?')) mutation.mutate(video.id); }} aria-label="Excluir vídeo"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-border/70 bg-background/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-2xl">
          <DialogHeader className="border-b border-border/60 bg-card/70 px-6 py-5">
            <div className="mb-1 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary"><Video className="h-3 w-3" /> {form.id ? 'Edição' : 'Novo cadastro'}</div>
            <DialogTitle className="text-2xl font-black tracking-tight">{form.id ? 'Editar vídeo ponte' : 'Novo vídeo ponte'}</DialogTitle>
            <DialogDescription>Conecte um conteúdo externo a um produto existente do catálogo.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-6">
            <section className="rounded-2xl border border-border/60 bg-card/50 p-5">
              <div className="mb-4 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Layers3 className="h-4 w-4" /></div><div><h3 className="text-sm font-black">Catálogo e identidade</h3><p className="text-xs text-muted-foreground">Defina onde este vídeo será exibido.</p></div></div>
              <div className="space-y-4">
                <div>
                  <Label className="font-bold">Produto *</Label>
                  <Select value={form.product_id} onValueChange={(value) => setForm((current) => ({ ...current, product_id: value }))}>
                    <SelectTrigger className="mt-2 h-11 rounded-xl"><SelectValue placeholder={productsLoading ? 'Carregando produtos...' : productsError ? 'Não foi possível carregar produtos' : 'Selecione um produto'} /></SelectTrigger>
                    <SelectContent>{products.map((product: any) => <SelectItem key={product.id} value={product.id}>{product.title}{product.status !== 'active' ? ` · ${product.status}` : ''}</SelectItem>)}</SelectContent>
                  </Select>
                  {selectedProduct && <p className="mt-2 text-xs font-semibold text-muted-foreground">Vinculado a: <span className="text-foreground">{selectedProduct.title}</span></p>}
                  {productsError && <p className="mt-2 text-xs font-semibold text-destructive">Não foi possível carregar os produtos disponíveis.</p>}
                </div>
                <div>
                  <Label className="font-bold">Título *</Label>
                  <Input value={form.title} maxLength={200} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="Ex.: Demonstração do produto em uso" className="mt-2 h-11 rounded-xl" />
                  <div className="mt-1 text-right text-[10px] font-bold text-muted-foreground">{form.title.length}/200</div>
                </div>
                <div>
                  <Label className="font-bold">Subtítulo</Label>
                  <Textarea value={form.subtitle} maxLength={500} onChange={(e) => setForm((current) => ({ ...current, subtitle: e.target.value }))} placeholder="Uma frase curta para contextualizar o vídeo..." className="mt-2 min-h-24 rounded-xl resize-none" />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-5">
              <div className="mb-4 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Link2 className="h-4 w-4" /></div><div><h3 className="text-sm font-black">Mídia e origem</h3><p className="text-xs text-muted-foreground">Use URLs públicas reais.</p></div></div>
              <div className="space-y-4">
                <div>
                  <Label className="font-bold">Plataforma *</Label>
                  <Select value={form.platform} onValueChange={(value: Platform) => setForm((current) => ({ ...current, platform: value }))}>
                    <SelectTrigger className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="tiktok">TikTok</SelectItem><SelectItem value="shopee">Shopee</SelectItem><SelectItem value="ml">Mercado Livre</SelectItem><SelectItem value="youtube">YouTube</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">Link externo *</Label>
                  <Input type="url" value={form.link} onChange={(e) => setForm((current) => ({ ...current, link: e.target.value }))} placeholder="https://..." className="mt-2 h-11 rounded-xl" />
                  <p className="mt-1.5 text-xs text-muted-foreground">O servidor valida se é uma URL válida antes de gravar.</p>
                </div>
                <div>
                  <Label className="font-bold">Thumbnail</Label>
                  <Input type="url" value={form.thumbnail} onChange={(e) => setForm((current) => ({ ...current, thumbnail: e.target.value }))} placeholder="https://..." className="mt-2 h-11 rounded-xl" />
                </div>
                {hasThumbnail && <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30"><img src={form.thumbnail} alt="Prévia da thumbnail" className="aspect-video w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></div>}
              </div>
            </section>

            <section className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
              <div className="flex items-start gap-3"><div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><CheckCircle2 className="h-4 w-4" /></div><div><p className="text-sm font-black">Publicação</p><p className="text-xs text-muted-foreground">Controla se o vídeo fica disponível no fluxo da loja.</p></div></div>
              <Switch checked={form.is_active} onCheckedChange={(value) => setForm((current) => ({ ...current, is_active: value }))} />
            </section>
          </div>

          <DialogFooter className="border-t border-border/60 bg-card/50 px-6 py-4">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving} className="rounded-xl font-bold">Cancelar</Button>
            <Button onClick={() => void submit()} disabled={saving || productsLoading || productsError} className="rounded-xl px-6 font-black shadow-lg shadow-primary/10">{saving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Criar vídeo ponte'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
