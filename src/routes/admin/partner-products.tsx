import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPartnerProductGrantsAdmin, setPartnerProductGrantAdmin } from "@/lib/partner-product-grants.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/partner-products")({ component: PartnerProductsAdmin });

type Partner = { id: string; display_name: string; partner_type: string | null; status: string };
type Product = { id: string; title: string; active: boolean; retail_price: number; hub_suppliers: { active: boolean } | null };
type Grant = { id: string; commercial_profile_id: string; product_id: string; active: boolean };

function PartnerProductsAdmin() {
  const load = useServerFn(getPartnerProductGrantsAdmin);
  const save = useServerFn(setPartnerProductGrantAdmin);
  const client = useQueryClient();
  const [partnerId, setPartnerId] = useState("");
  const [productId, setProductId] = useState("");
  const query = useQuery({ queryKey: ["admin-partner-product-grants"], queryFn: () => load() });
  const partners = (query.data?.profiles ?? []) as Partner[];
  const products = (query.data?.products ?? []) as Product[];
  const grants = (query.data?.grants ?? []) as Grant[];
  const selectablePartners = partners.filter(partner => partner.status === "approved" || grants.some(grant => grant.commercial_profile_id === partner.id && grant.active));
  const selected = grants.find(grant => grant.commercial_profile_id === partnerId && grant.product_id === productId);
  const selectedPartner = partners.find(partner => partner.id === partnerId);
  const activeGrantCount = grants.filter(grant => grant.active).length;
  const selectedProduct = products.find(product => product.id === productId);
  const canAuthorize = !!selectedProduct?.active && Number(selectedProduct.retail_price) > 0 && selectedProduct.hub_suppliers?.active === true;
  const approvedPartnerCount = partners.filter(partner => partner.status === "approved").length;
  const mutation = useMutation({
    mutationFn: (active: boolean) => save({ data: { commercial_profile_id: partnerId, product_id: productId, active } }),
    onSuccess: () => {
      toast.success("Autorização atualizada");
      void client.invalidateQueries({ queryKey: ["admin-partner-product-grants"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return <main className="mx-auto max-w-5xl space-y-7 px-4 py-28">
    <header>
      <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI · Shadow Master</p>
      <h1 className="mt-3 text-4xl font-black">Produtos autorizados por parceiro</h1>
      <p className="mt-3 text-muted-foreground">Cada parceiro recebe apenas produtos autorizados. A autorização não concede acesso automático ao atacado, nem altera comissão ou checkout.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border bg-card/70 p-4"><p className="text-sm text-muted-foreground">Parceiros aprovados</p><p className="text-3xl font-black">{approvedPartnerCount}</p></div><div className="rounded-2xl border bg-card/70 p-4"><p className="text-sm text-muted-foreground">Autorizações ativas</p><p className="text-3xl font-black">{activeGrantCount}</p></div></div>
    </header>
    {query.isLoading && <p role="status">Carregando autorizações...</p>}
    {query.isError && <div role="alert"><p>Não foi possível consultar as autorizações. Verifique se a migration foi aplicada e se você tem acesso de Admin Master.</p><Button className="mt-3" variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {!query.isLoading && !query.isError && <section className="space-y-5 rounded-3xl border border-white/10 bg-card/80 p-6">
      <label className="block space-y-2 text-sm font-medium">
        <span>Parceiro aprovado ou com autorização ativa</span>
        <select className="flex h-10 w-full rounded-md border bg-background px-3" value={partnerId} onChange={event => { setPartnerId(event.target.value); setProductId(""); }}>
          <option value="">Selecione</option>
          {selectablePartners.map(partner => <option key={partner.id} value={partner.id}>{partner.display_name} ({partner.partner_type ?? "parceiro"}){partner.status !== "approved" ? " · não aprovado" : ""}</option>)}
        </select>
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>Produto</span>
        <select className="flex h-10 w-full rounded-md border bg-background px-3" value={productId} onChange={event => setProductId(event.target.value)}>
          <option value="">Selecione</option>
          {products.map(product => <option key={product.id} value={product.id}>{product.title}{product.active ? "" : " (rascunho)"}</option>)}
        </select>
      </label>
      {selectedPartner && <p className="rounded-xl border p-3 text-sm">Perfil: <strong>{selectedPartner.partner_type ?? "parceiro"}</strong>. Condição padrão de divulgação: <strong>varejo</strong>. Acordos comerciais especiais e acesso ao atacado exigem autorização específica; esta tela controla somente quais produtos podem ser divulgados.</p>}
      {partnerId && productId && <p className="rounded-xl border p-3 text-sm" role="status">Produto para este parceiro: <strong>{selected?.active ? "autorizado para divulgação no varejo" : "não autorizado"}</strong>. A liberação de produto não concede preço B2B ou altera comissão. Para divulgar uma oferta de atacado, é necessário um acordo comercial específico validado pelo Shadow Master.</p>}
      {partnerId && productId && !canAuthorize && <p role="alert" className="text-sm text-destructive">Para autorizar, o produto deve estar publicado, com preço de varejo positivo e fornecedor ativo. Revogações continuam disponíveis.</p>}
      {partnerId && productId && <div className="space-y-3">
        <p className="text-sm">Situação atual: <strong>{selected?.active ? "Autorizado" : "Não autorizado"}</strong></p>
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending || partners.find(partner => partner.id === partnerId)?.status !== "approved" || !canAuthorize} onClick={() => mutation.mutate(true)}>Autorizar produto</Button>
          <Button variant="outline" disabled={mutation.isPending || !selected?.active} onClick={() => mutation.mutate(false)}>Revogar autorização</Button>
        </div>
      </div>}
      {selectablePartners.length === 0 && <p className="text-sm text-muted-foreground">Nenhum parceiro aprovado ou com autorização ativa.</p>}
    </section>}
  </main>;
}
