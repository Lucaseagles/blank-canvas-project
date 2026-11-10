import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHubCatalogAdmin, saveHubProductAdmin, saveHubSupplierAdmin, saveHubB2BTierAdmin } from "@/lib/hub-catalog.functions";
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
  const saveSupplier = useServerFn(saveHubSupplierAdmin);
  const saveTier = useServerFn(saveHubB2BTierAdmin);
  const [tierProductId, setTierProductId] = useState("");
  const [tierQuantity, setTierQuantity] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierMode, setSupplierMode] = useState<"supplier" | "hub">("supplier");
  const query = useQuery({ queryKey: ["admin-hub-catalog"], queryFn: () => load() });
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const suppliers = (query.data?.suppliers ?? []) as Supplier[];
  const products = (query.data?.products ?? []) as Product[];
  const tiers = (query.data?.tiers ?? []) as Array<{ id: string; product_id: string; min_quantity: number; unit_price: number }>;
  const publishedCount = products.filter(product => product.active).length;
  const wholesaleCount = products.filter(product => product.active && Number(product.b2b_base_price) > 0).length;

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

  const supplierMutation = useMutation({
    mutationFn: () => saveSupplier({ data: { name: supplierName.trim(), fulfillment_mode: supplierMode, active: true } }),
    onSuccess: () => {
      toast.success("Fornecedor cadastrado");
      setSupplierName("");
      void queryClient.invalidateQueries({ queryKey: ["admin-hub-catalog"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const tierMutation = useMutation({
    mutationFn: () => {
      const min_quantity = Number(tierQuantity);
      const unit_price = Number(tierPrice);
      if (!tierProductId || !Number.isSafeInteger(min_quantity) || min_quantity < 1 || !Number.isFinite(unit_price) || unit_price <= 0) {
        throw new Error("Selecione um produto e informe quantidade e preço válidos.");
      }
      return saveTier({ data: { product_id: tierProductId, min_quantity, unit_price } });
    },
    onSuccess: () => {
      toast.success("Faixa de preço salva");
      setTierQuantity("");
      setTierPrice("");
      void queryClient.invalidateQueries({ queryKey: ["admin-hub-catalog"] });
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

  // Simulação comercial a partir do custo informado pelo fornecedor; nunca equivale a lucro líquido.
  const hasMarginInputs = form.retail_price.trim() !== "" && form.supplier_cost.trim() !== "";
  const previewRetail = Number(form.retail_price);
  const previewCost = Number(form.supplier_cost);
  const previewB2B = form.b2b_base_price.trim() ? Number(form.b2b_base_price) : null;
  const previewMinimum = Number(form.min_b2b_quantity);
  const previewReady = hasMarginInputs && Number.isFinite(previewRetail) && previewRetail >= 0
    && Number.isFinite(previewCost) && previewCost >= 0;
  const previewRetailMargin = previewRetail - previewCost;
  const previewWholesaleMargin = previewB2B === null ? null : previewB2B - previewCost;
  const previewPartnerMargin = previewRetailMargin / 2;

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
        <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI · Shadow Master</p>
        <h1 className="mt-3 text-4xl font-black">Catálogo & fornecedores</h1>
        <p className="mt-3 text-muted-foreground">Cadastre uma vez, defina varejo e atacado, e publique para o público correto. Preços de custo são privados; use apenas dados confirmados pelo fornecedor.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resumo do catálogo">
          <div className="rounded-2xl border bg-card/70 p-4"><p className="text-sm text-muted-foreground">Produtos cadastrados</p><p className="text-3xl font-black">{products.length}</p></div>
          <div className="rounded-2xl border bg-card/70 p-4"><p className="text-sm text-muted-foreground">Publicados no varejo</p><p className="text-3xl font-black">{publishedCount}</p></div>
          <div className="rounded-2xl border bg-card/70 p-4"><p className="text-sm text-muted-foreground">Disponíveis no atacado</p><p className="text-3xl font-black">{wholesaleCount}</p></div>
        </div>
      </header>
      {query.isLoading && <p role="status">Carregando catálogo...</p>}
      {query.isError && <div role="alert" className="space-y-3"><p>Não foi possível carregar o catálogo.</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
      {!query.isError && (
        <>
          <section className="space-y-4 rounded-3xl border border-white/10 bg-card/80 p-6">
            <h2 className="text-xl font-bold">Fornecedores ({suppliers.length})</h2>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={event => { event.preventDefault(); supplierMutation.mutate(); }}>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Nome do fornecedor</span>
                <Input required minLength={2} maxLength={160} value={supplierName} onChange={event => setSupplierName(event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Responsável pelo envio</span>
                <select className="flex h-10 w-full rounded-md border bg-background px-3" value={supplierMode} onChange={event => setSupplierMode(event.target.value as "supplier" | "hub")}>
                  <option value="supplier">Fornecedor</option>
                  <option value="hub">Hub</option>
                </select>
              </label>
              <Button type="submit" disabled={supplierMutation.isPending || supplierName.trim().length < 2}>
                {supplierMutation.isPending ? "Salvando..." : "Cadastrar fornecedor"}
              </Button>
            </form>
            {suppliers.length === 0 && <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</p>}
            <ul className="space-y-2 text-sm">
              {suppliers.map(supplier => <li key={supplier.id} className="rounded-xl border border-white/10 p-3">{supplier.name}</li>)}
            </ul>
          </section>
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
            <aside aria-label="Simulação de margens RUBI 11×" className="md:col-span-2 space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <h3 className="text-lg font-bold">RUBI 11× · Margem por canal</h3>
              <p className="text-sm text-muted-foreground">Simulação baseada nos preços e no custo que você cadastrou. Não é previsão de vendas nem lucro líquido.</p>
              {!previewReady ? <p className="text-sm">Preencha o preço de varejo e o custo do fornecedor para simular.</p> : <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">Venda própria direta · diferença/unidade</p><p className="text-xl font-black">{brl(previewRetailMargin)}</p></div>
                  <div className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">Parceiro · RUBI retém 50% da diferença</p><p className="text-xl font-black">{brl(previewPartnerMargin)}</p></div>
                  <div className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">Parceiro recebe 50% da diferença</p><p className="text-xl font-black">{brl(previewPartnerMargin)}</p></div>
                  <div className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">Atacado · diferença/unidade</p><p className="text-xl font-black">{previewWholesaleMargin === null ? "Não configurado" : brl(previewWholesaleMargin)}</p></div>
                </div>
                {previewWholesaleMargin !== null && Number.isSafeInteger(previewMinimum) && previewMinimum > 0 && <p className="text-sm">Pedido mínimo de {previewMinimum.toLocaleString("pt-BR")} unidades: diferença bruta total de <strong>{brl(previewWholesaleMargin * previewMinimum)}</strong>.</p>}
                {(previewRetailMargin <= 0 || (previewWholesaleMargin !== null && previewWholesaleMargin <= 0)) && <p role="alert" className="text-sm font-semibold text-destructive">Atenção: um dos preços cadastrados não supera o custo do fornecedor. Revise a precificação antes de divulgar.</p>}
              </>}
              <p className="text-xs text-muted-foreground">A divisão 50/50 é apenas um exemplo do Plano 11×. Comissões reais dependem do acordo ativo de cada parceiro. Impostos, tarifas, devoluções e despesas não incluídas no custo do fornecedor reduzem os valores.</p>
            </aside>
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
          <section className="space-y-4 rounded-3xl border border-white/10 bg-card/80 p-6">
            <h2 className="text-xl font-bold">Preços progressivos para lojistas</h2>
            <p className="text-sm text-muted-foreground">Um único produto pode ter várias faixas para lojistas aprovados (ex.: 10, 20 ou 50 unidades). A mesma quantidade atualiza a faixa existente. Os preços de atacado não aparecem no catálogo de consumidores. Confirme as condições com o fornecedor.</p>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={event => { event.preventDefault(); tierMutation.mutate(); }}>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Produto com preço B2B</span>
                <select required className="flex h-10 w-full rounded-md border bg-background px-3" value={tierProductId} onChange={event => setTierProductId(event.target.value)}>
                  <option value="">Selecione</option>
                  {products.filter(product => Number(product.b2b_base_price) > 0).map(product => <option key={product.id} value={product.id}>{product.title}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Quantidade a partir de</span>
                <Input type="number" required min={1} step={1} value={tierQuantity} onChange={event => setTierQuantity(event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Preço unitário (R$)</span>
                <Input type="number" required min="0.01" step="0.01" value={tierPrice} onChange={event => setTierPrice(event.target.value)} />
              </label>
              <Button type="submit" disabled={tierMutation.isPending || !tierProductId}>
                {tierMutation.isPending ? "Salvando..." : "Salvar faixa de preço"}
              </Button>
            </form>
            {tiers.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma faixa de preço cadastrada.</p>}
            <ul className="space-y-2 text-sm">
              {tiers.map(tier => <li key={tier.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-white/10 p-3">
                <span>{products.find(product => product.id === tier.product_id)?.title ?? "Produto não encontrado"} · a partir de {tier.min_quantity} un.</span>
                <strong>{brl(Number(tier.unit_price))}/un.</strong>
              </li>)}
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-bold">Produtos cadastrados ({products.length})</h2>
            {products.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>}
            {products.map(product => (
              <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-muted-foreground">Varejo: {brl(Number(product.retail_price))} · {product.active ? "Publicado" : "Rascunho"}</p>
                  <p className="text-sm text-muted-foreground">Atacado: {product.b2b_base_price === null ? "Não habilitado" : `${brl(Number(product.b2b_base_price))}/un. · mínimo ${product.min_b2b_quantity} un.`}</p>
                  {tiers.filter(tier => tier.product_id === product.id).length > 0 && <p className="text-xs text-muted-foreground">Faixas B2B: {tiers.filter(tier => tier.product_id === product.id).sort((a,b) => a.min_quantity - b.min_quantity).map(tier => `${tier.min_quantity}+ un.: ${brl(Number(tier.unit_price))}`).join(" · ")}</p>}
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
