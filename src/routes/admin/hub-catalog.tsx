import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHubCatalogAdmin, saveHubProductAdmin } from "@/lib/hub-catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/hub-catalog")({ component: HubCatalogAdmin });

type Supplier = { id: string; name: string };
type Product = {
  id: string; title: string; description: string | null; image_url: string | null;
  category: string | null; sku: string | null; supplier_id: string;
  retail_price: number; supplier_cost: number; b2b_base_price: number | null;
  min_b2b_quantity: number; active: boolean;
};
type ProductForm = {
  id?: string; title: string; description: string; image_url: string;
  category: string; sku: string; supplier_id: string; retail_price: string;
  supplier_cost: string; b2b_base_price: string; min_b2b_quantity: string; active: boolean;
};
const emptyForm = (): ProductForm => ({
  title: "", description: "", image_url: "", category: "", sku: "",
  supplier_id: "", retail_price: "", supplier_cost: "",
  b2b_base_price: "", min_b2b_quantity: "1", active: false,
});
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function HubCatalogAdmin() {
  const queryClient = useQueryClient();
  const load = useServerFn(getHubCatalogAdmin);
  const save = useServerFn(saveHubProductAdmin);
  const query = useQuery({ queryKey: ["admin-hub-catalog"], queryFn: () => load() });
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const suppliers = (query.data?.suppliers ?? []) as Supplier[];
  const products = (query.data?.products ?? []) as Product[];

  const mutation = useMutation({
    mutationFn: () => {
      if (!form.supplier_id || !form.title.trim()) throw new Error("Informe o fornecedor e o nome do produto.");
      if (!form.retail_price.trim() || !form.supplier_cost.trim()) throw new Error("Informe os preços reais de varejo e de custo.");
      const retail = Number(form.retail_price);
      const cost = Number(form.supplier_cost);
      const b2b = form.b2b_base_price.trim() === "" ? null : Number(form.b2b_base_price);
      const minimum = Number(form.min_b2b_quantity);
      if (![retail, cost, ...(b2b === null ? [] : [b2b])].every(n => Number.isFinite(n) && n >= 0)) {
        throw new Error("Os preços precisam ser valores numéricos válidos e não negativos.");
      }
      if (!Number.isSafeInteger(minimum) || minimum < 1) throw new Error("A quantidade mínima deve ser um inteiro positivo.");
      if (form.active && (retail <= 0 || (b2b !== null && b2b <= 0))) {
        throw new Error("Para publicar, informe preços de venda maiores que zero.");
      }
      return save({ data: {
        ...(form.id ? { id: form.id } : {}),
        supplier_id: form.supplier_id, title: form.title.trim(),
        description: form.description.trim(), image_url: form.image_url.trim(),
        category: form.category.trim(), sku: form.sku.trim(),
        retail_price: retail, supplier_cost: cost, b2b_base_price: b2b,
        min_b2b_quantity: minimum, active: form.active,
      } });
    },
    onSuccess: () => {
      toast.success(form.id ? "Produto atualizado" : "Produto cadastrado");
      void queryClient.invalidateQueries({ queryKey: ["admin-hub-catalog"] });
      setForm(emptyForm());
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const edit = (product: Product) => {
    setForm({
      id: product.id, title: product.title, description: product.description ?? "",
      image_url: product.image_url ?? "", category: product.category ?? "",
      sku: product.sku ?? "", supplier_id: product.supplier_id,
      retail_price: String(product.retail_price), supplier_cost: String(product.supplier_cost),
      b2b_base_price: product.b2b_base_price === null ? "" : String(product.b2b_base_price),
      min_b2b_quantity: String(product.min_b2b_quantity), active: product.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const field = (key: keyof Omit<ProductForm, "id" | "active">, label: string, type = "text") => (
    <label className="space-y-2 text-sm font-medium">
      <span className="block">{label}</span>
      <Input
        type={type}
        required={["title", "retail_price", "supplier_cost", "min_b2b_quantity"].includes(key)}
        min={type === "number" ? (key === "min_b2b_quantity" ? 1 : 0) : undefined}
        step={type === "number" ? (key === "min_b2b_quantity" ? 1 : "0.01") : undefined}
        value={form[key]}
        onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))}
      />
    </label>
  );

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-28">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-primary">Hub Eagles · Administração</p>
        <h1 className="mt-3 text-4xl font-black">Catálogo & fornecedores</h1>
        <p className="mt-3 text-muted-foreground">Preços de custo são privados. Cadastre somente dados reais confirmados pelo fornecedor.</p>
      </header>
      {query.isLoading && <p role="status">Carregando catálogo...</p>}
      {query.isError && <div role="alert" className="space-y-3"><p>Não foi possível carregar o catálogo.</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
      {!query.isError && (
        <>
          <form onSubmit={event => { event.preventDefault(); mutation.mutate(); }} className="grid gap-5 rounded-3xl border border-white/10 bg-card/80 p-6 md:grid-cols-2">
            <h2 className="md:col-span-2 text-xl font-bold">{form.id ? "Editar produto" : "Cadastrar produto"}</h2>
            <label className="space-y-2 text-sm font-medium">
              <span className="block">Fornecedor</span>
              <select required className="flex h-10 w-full rounded-md border bg-background px-3" value={form.supplier_id} onChange={event => setForm(previous => ({ ...previous, supplier_id: event.target.value }))}>
                <option value="">Selecione</option>
                {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </label>
            {field("title", "Nome do produto")}
            {field("sku", "SKU")}
            {field("category", "Categoria")}
            {field("image_url", "URL da imagem", "url")}
            {field("retail_price", "Preço consumidor (R$)", "number")}
            {field("supplier_cost", "Custo fornecedor (R$)", "number")}
            {field("b2b_base_price", "Preço lojista (R$)", "number")}
            {field("min_b2b_quantity", "Quantidade mínima B2B", "number")}
            {field("description", "Descrição")}
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={form.active} onChange={event => setForm(previous => ({ ...previous, active: event.target.checked }))} />
              Publicar produto
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={mutation.isPending || !form.supplier_id || query.isLoading}>
                {mutation.isPending ? "Salvando..." : form.id ? "Salvar alterações" : "Cadastrar produto"}
              </Button>
              {form.id && <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => setForm(emptyForm())}>Cancelar edição</Button>}
            </div>
          </form>
          <section className="space-y-3">
            <h2 className="text-2xl font-bold">Produtos cadastrados ({products.length})</h2>
            {products.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>}
            {products.map(product => (
              <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-muted-foreground">{brl(Number(product.retail_price))} · {product.active ? "Publicado" : "Rascunho"}</p>
                </div>
                <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => edit(product)}>Editar</Button>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
