import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { listBundles, saveBundle, removeBundle } from '@/lib/relationships.functions';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Package, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createFileRoute('/admin/bundles')({ component: AdminBundlesPage });

type Product = { id: string; title: string; status: string };
type Bundle = { id: string; title: string; slug: string; description?: string | null; image_url?: string | null; is_active: boolean; bundle_discount_price?: number | null };
type Form = { title: string; slug: string; description: string; image_url: string; is_active: boolean; bundle_discount_price: string; products: string[] };
const emptyForm: Form = { title: '', slug: '', description: '', image_url: '', is_active: true, bundle_discount_price: '', products: [] };

function AdminBundlesPage() {
  const queryClient = useQueryClient();
  const fetchBundles = useServerFn(listBundles);
  const saveBundleFn = useServerFn(saveBundle);
  const deleteBundleFn = useServerFn(removeBundle);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bundle | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const bundlesQuery = useQuery({ queryKey: ['admin-bundles'], queryFn: () => fetchBundles() });
  const productsQuery = useQuery({
    queryKey: ['admin-bundle-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id,title,status').eq('status', 'active').order('title');
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: Form & { id?: string }) => saveBundleFn({ data: {
      ...data,
      description: data.description || null,
      image_url: data.image_url || null,
      bundle_discount_price: data.bundle_discount_price ? Number(data.bundle_discount_price) : null,
      products: data.products.map((id, position) => ({ id, position })),
    } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-bundles'] }); closeModal(); toast.success('Bundle salvo com sucesso.'); },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Não foi possível salvar o bundle.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBundleFn({ data: id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-bundles'] }); toast.success('Bundle excluído.'); },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Não foi possível excluir o bundle.'),
  });

  function closeModal() { setOpen(false); setEditing(null); setForm(emptyForm); }
  function editBundle(bundle: Bundle) {
    setEditing(bundle);
    setForm({ title: bundle.title, slug: bundle.slug, description: bundle.description ?? '', image_url: bundle.image_url ?? '', is_active: bundle.is_active, bundle_discount_price: bundle.bundle_discount_price?.toString() ?? '', products: [] });
    setOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    const slug = form.slug.trim().toLowerCase();
    if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { toast.error('Informe um título e um slug válido (ex.: meu-bundle).'); return; }
    if (form.bundle_discount_price && (!Number.isFinite(Number(form.bundle_discount_price)) || Number(form.bundle_discount_price) < 0)) { toast.error('Preço promocional inválido.'); return; }
    saveMutation.mutate(editing ? { ...form, title, slug, id: editing.id } : { ...form, title, slug });
  }

  const bundles = (bundlesQuery.data ?? []) as Bundle[];
  const products = productsQuery.data ?? [];

  return <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
      <div className="space-y-2"><Badge variant="outline">COMMANDER INTERFACE</Badge><h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter">Bundle Management</h1><p className="text-muted-foreground font-medium">Crie kits, escolha produtos, preço promocional e publicação.</p></div>
      <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : closeModal()}>
        <DialogTrigger asChild><Button className="h-11 rounded-xl font-black uppercase tracking-widest gap-2" onClick={() => { setEditing(null); setForm(emptyForm); }}><Plus className="w-5 h-5" /> Novo bundle</Button></DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <form onSubmit={submit}><DialogHeader><DialogTitle className="text-2xl font-black uppercase italic">{editing ? 'Editar bundle' : 'Novo bundle'}</DialogTitle></DialogHeader>
            <div className="grid gap-5 py-6">
              <div><Label>Título</Label><Input maxLength={200} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Slug</Label><Input maxLength={200} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="meu-bundle" /></div>
              <div><Label>Descrição</Label><Textarea maxLength={5000} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><Label>Imagem (URL)</Label><Input type="url" maxLength={2000} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
              <div><Label>Preço promocional do bundle</Label><Input type="number" min="0" step="0.01" value={form.bundle_discount_price} onChange={e => setForm(f => ({ ...f, bundle_discount_price: e.target.value }))} placeholder="Opcional" /></div>
              <div><Label>Produtos ativos</Label><Select value="" onValueChange={id => setForm(f => f.products.includes(id) ? f : ({ ...f, products: [...f.products, id] }))}><SelectTrigger><SelectValue placeholder={productsQuery.isLoading ? 'Carregando produtos...' : 'Adicionar produto'} /></SelectTrigger><SelectContent>{products.filter(p => !form.products.includes(p.id)).map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select>
                <div className="mt-2 space-y-2">{form.products.map((id, i) => { const p = products.find(x => x.id === id); return <div key={id} className="flex items-center justify-between rounded-lg border p-2 text-sm"><span>{i + 1}. {p?.title ?? 'Produto'}</span><Button type="button" variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, products: f.products.filter(x => x !== id) }))}>Remover</Button></div>; })}</div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3"><Label>Bundle ativo</Label><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /></div>
            </div>
            <DialogFooter><Button type="submit" className="w-full h-11" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Salvando...' : 'Salvar bundle'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    {bundlesQuery.isLoading && <div className="py-16 text-center text-muted-foreground">Carregando bundles...</div>}
    {bundlesQuery.isError && <div className="rounded-xl border border-destructive/30 p-8 text-center text-destructive">Não foi possível carregar os bundles. Tente novamente.</div>}
    {!bundlesQuery.isLoading && !bundlesQuery.isError && bundles.length === 0 && <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground"><Package className="mx-auto mb-3 h-10 w-10" /><p className="font-bold">Nenhum bundle cadastrado.</p><p className="text-sm">Crie o primeiro kit para disponibilizá-lo na área pública.</p></div>}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{bundles.map(bundle => <div key={bundle.id} className="rounded-2xl border bg-card p-5 space-y-5">
      <div className="flex justify-between items-start"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Package /></div><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => editBundle(bundle)} aria-label="Editar bundle"><Edit2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" disabled={deleteMutation.isPending} onClick={() => window.confirm(`Excluir o bundle “${bundle.title}”?`) && deleteMutation.mutate(bundle.id)} aria-label="Excluir bundle"><Trash2 className="w-4 h-4" /></Button></div></div>
      <div><h2 className="text-xl font-black uppercase italic">{bundle.title}</h2><p className="text-sm text-muted-foreground line-clamp-2">{bundle.description || 'Sem descrição.'}</p></div>
      <div className="flex items-center justify-between border-t pt-4"><Badge variant={bundle.is_active ? 'secondary' : 'outline'}>{bundle.is_active ? 'Ativo' : 'Inativo'}</Badge>{bundle.bundle_discount_price != null && <span className="text-sm font-bold">R$ {Number(bundle.bundle_discount_price).toFixed(2)}</span>}<Button variant="ghost" size="sm" asChild><a href={`/bundle/${bundle.slug}`} target="_blank" rel="noreferrer"><Eye className="mr-2 h-4 w-4" />Preview</a></Button></div>
    </div>)}</div>
  </div>;
}
