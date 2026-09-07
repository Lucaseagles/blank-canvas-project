import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  createProduct,
  getCategories,
  getMarketplaces,
  getProduct,
  ProductFormData,
  updateProduct,
} from "@/lib/supabase/products";

const emptyForm: ProductFormData = {
  title: "",
  description: null,
  category_id: null,
  marketplace_id: null,
  external_product_id: null,
  affiliate_url: "",
  current_price: 0,
  previous_price: null,
  discount: null,
  rating: null,
  review_count: null,
  free_shipping: false,
  status: "draft",
  images: [],
  is_active: true,
};

export interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
}

export function ProductForm({ mode, productId }: ProductFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [marketplaces, setMarketplaces] = useState<{ id: string; name: string }[]>([]);
  const [tag, setTag] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCategories(), getMarketplaces()])
      .then(([cats, mps]) => {
        if (!mounted) return;
        setCategories(cats);
        setMarketplaces(mps);
      })
      .catch((error) => toast.error(error.message));

    if (mode === "edit" && productId) {
      getProduct(productId)
        .then((product: any) => {
          if (!mounted) return;
          setForm({
            ...emptyForm,
            title: product.title ?? "",
            description: product.description ?? null,
            category_id: product.category_id ?? null,
            marketplace_id: product.marketplace_id ?? null,
            external_product_id: product.external_product_id ?? null,
            affiliate_url: product.affiliate_url ?? "",
            current_price: Number(product.current_price ?? 0),
            previous_price: product.previous_price == null ? null : Number(product.previous_price),
            discount: product.discount == null ? null : Number(product.discount),
            rating: product.rating == null ? null : Number(product.rating),
            review_count: product.review_count == null ? null : Number(product.review_count),
            free_shipping: Boolean(product.free_shipping),
            status: product.status ?? "draft",
            images: Array.isArray(product.images) ? product.images : [],
            is_active: product.status !== "archived",
          });
        })
        .catch((error) => toast.error(`Não foi possível carregar o produto: ${error.message}`))
        .finally(() => mounted && setLoading(false));
    }
    return () => { mounted = false; };
  }, [mode, productId]);

  const patch = (value: Partial<ProductFormData>) => setForm((current) => ({ ...current, ...value }));

  const addImage = () => {
    const value = imageUrl.trim();
    if (!value || form.images.includes(value)) return;
    patch({ images: [...form.images, value] });
    setImageUrl("");
  };

  const addTag = () => {
    const value = tag.trim();
    if (!value) return;
    setTag("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return toast.error("Título é obrigatório.");
    if (!form.category_id) return toast.error("Selecione uma categoria.");
    if (!form.marketplace_id) return toast.error("Selecione um marketplace.");
    if (!form.affiliate_url.trim()) return toast.error("Link de afiliado é obrigatório.");
    if (form.current_price <= 0) return toast.error("Preço atual deve ser maior que zero.");

    setSaving(true);
    const result = mode === "create"
      ? await createProduct(form)
      : await updateProduct(productId!, form);
    setSaving(false);

    if (!result.success) return toast.error(result.error);
    toast.success(mode === "create" ? "Produto criado com sucesso!" : "Produto atualizado com sucesso!");
    const id = (result.data as any)?.id ?? productId;
    if (id) navigate({ to: `/admin/products/${id}/edit` });
  };

  if (loading) return <div className="container mx-auto max-w-5xl py-16 text-center">Carregando produto...</div>;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate({ to: "/admin/products" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Badge variant="outline">{mode === "create" ? "NOVO PRODUTO" : "EDITAR PRODUTO"}</Badge>
      </div>

      <div>
        <h1 className="text-4xl font-black tracking-tight">{mode === "create" ? "Novo Produto" : "Editar Produto"}</h1>
        <p className="mt-2 text-muted-foreground">Cadastre os dados do produto, oferta, marketplace e mídia.</p>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-lg font-bold">Informações básicas</h2>
            <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => patch({ title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea rows={5} value={form.description ?? ""} onChange={(e) => patch({ description: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Categoria *</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.category_id ?? ""} onChange={(e) => patch({ category_id: e.target.value || null })}><option value="">Selecione...</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
              <div className="space-y-2"><Label>Marketplace *</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.marketplace_id ?? ""} onChange={(e) => patch({ marketplace_id: e.target.value || null })}><option value="">Selecione...</option>{marketplaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-lg font-bold">Preço e oferta</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Preço atual *</Label><Input type="number" step="0.01" min="0" value={form.current_price || ""} onChange={(e) => patch({ current_price: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Preço anterior</Label><Input type="number" step="0.01" min="0" value={form.previous_price ?? ""} onChange={(e) => patch({ previous_price: e.target.value ? Number(e.target.value) : null })} /></div>
              <div className="space-y-2"><Label>Desconto (%)</Label><Input type="number" min="0" max="100" value={form.discount ?? ""} onChange={(e) => patch({ discount: e.target.value ? Number(e.target.value) : null })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Rating</Label><Input type="number" step="0.1" min="0" max="5" value={form.rating ?? ""} onChange={(e) => patch({ rating: e.target.value ? Number(e.target.value) : null })} /></div>
              <div className="space-y-2"><Label>Nº de avaliações</Label><Input type="number" min="0" value={form.review_count ?? ""} onChange={(e) => patch({ review_count: e.target.value ? Number(e.target.value) : null })} /></div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-lg font-bold">Link e identificação</h2>
            <div className="space-y-2"><Label>Link de afiliado *</Label><Input type="url" value={form.affiliate_url} onChange={(e) => patch({ affiliate_url: e.target.value })} /></div>
            <div className="space-y-2"><Label>ID externo</Label><Input value={form.external_product_id ?? ""} onChange={(e) => patch({ external_product_id: e.target.value || null })} /></div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-lg font-bold">Imagens</h2>
            <div className="flex gap-2"><Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }} /><Button type="button" onClick={addImage}><Plus className="h-4 w-4" /></Button></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{form.images.map((url) => <div key={url} className="group relative overflow-hidden rounded-xl border"><img src={url} alt="" className="aspect-square w-full object-cover" /><button type="button" onClick={() => patch({ images: form.images.filter((item) => item !== url) })} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X className="h-3 w-3" /></button></div>)}</div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-lg font-bold">Publicação</h2>
            <div className="space-y-2"><Label>Status</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.status} onChange={(e) => patch({ status: e.target.value as ProductStatus })}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option><option value="active">Ativo</option></select></div>
            <label className="flex items-center justify-between rounded-xl border p-3 text-sm font-medium">Frete grátis<input type="checkbox" checked={form.free_shipping} onChange={(e) => patch({ free_shipping: e.target.checked })} /></label>
          </section>
          <Button type="submit" className="w-full h-12 font-bold" disabled={saving}>{saving ? "Salvando..." : <><Save className="mr-2 h-4 w-4" /> {mode === "create" ? "Criar Produto" : "Salvar Alterações"}</>}</Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => navigate({ to: "/admin/products" })}><Trash2 className="mr-2 h-4 w-4" /> Cancelar</Button>
        </aside>
      </form>
    </div>
  );
}
