import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPartnerProductGrantsAdmin, setPartnerProductGrantAdmin } from "@/lib/partner-product-grants.functions";
import { getPartnerWholesalePermissionsAdmin, setPartnerWholesalePermissionAdmin } from "@/lib/partner-wholesale-permissions.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/partner-products")({ component: PartnerProductsAdmin });

type Partner = { id: string; display_name: string; partner_type: string | null; status: string };
type Product = { id: string; title: string; active: boolean };
type Grant = { id: string; commercial_profile_id: string; product_id: string; active: boolean };

function PartnerProductsAdmin() {
  const load = useServerFn(getPartnerProductGrantsAdmin);
  const save = useServerFn(setPartnerProductGrantAdmin);
  const loadWholesale = useServerFn(getPartnerWholesalePermissionsAdmin);
  const saveWholesale = useServerFn(setPartnerWholesalePermissionAdmin);
  const client = useQueryClient();
  const [partnerId, setPartnerId] = useState("");
  const [productId, setProductId] = useState("");
  const query = useQuery({ queryKey: ["admin-partner-product-grants"], queryFn: () => load() });
  const wholesaleQuery = useQuery({ queryKey: ["admin-partner-wholesale-permissions"], queryFn: () => loadWholesale(), retry: false });
  const partners = (query.data?.profiles ?? []) as Partner[];
  const products = (query.data?.products ?? []) as Product[];
  const grants = (query.data?.grants ?? []) as Grant[];
  const selectablePartners = partners.filter(partner => partner.status === "approved" || grants.some(grant => grant.commercial_profile_id === partner.id && grant.active));
  const selected = grants.find(grant => grant.commercial_profile_id === partnerId && grant.product_id === productId);
  const selectedPartner = partners.find(partner => partner.id === partnerId);
  const wholesalePermissions = (wholesaleQuery.data ?? []) as { commercial_profile_id: string; product_id: string; active: boolean }[];
  const wholesalePermission = wholesalePermissions.find(item => item.commercial_profile_id === partnerId && item.product_id === productId);
  const wholesaleMutation = useMutation({
    mutationFn: (active: boolean) => saveWholesale({ data: { commercial_profile_id: partnerId, product_id: productId, active } }),
    onSuccess: () => { toast.success("Permissão de atacado atualizada."); void client.invalidateQueries({ queryKey: ["admin-partner-wholesale-permissions"] }); },
    onError: (error: Error) => toast.error(error.message),
  });
  const activeGrantCount = grants.filter(grant => grant.active).length;
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
      {partnerId && productId && <div className="space-y-3">
        <p className="text-sm">Situação atual: <strong>{selected?.active ? "Autorizado" : "Não autorizado"}</strong></p>
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending || partners.find(partner => partner.id === partnerId)?.status !== "approved" || !products.find(product => product.id === productId)?.active} onClick={() => mutation.mutate(true)}>Autorizar produto</Button>
          <Button variant="outline" disabled={mutation.isPending || !selected?.active} onClick={() => mutation.mutate(false)}>Revogar autorização</Button>
        </div>
      </div>}
      {partnerId && productId && <div className="space-y-3 rounded-2xl border p-4">
        <h2 className="font-bold">Condição comercial: atacado</h2>
        <p className="text-sm text-muted-foreground">Permissão individual, independente do tipo de parceiro e da comissão. Exige parceiro aprovado, produto autorizado e preço B2B válido.</p>
        {wholesaleQuery.isLoading && <p role="status">Carregando condições...</p>}
        {wholesaleQuery.isError && <p role="alert">Não foi possível consultar permissões de atacado. Confirme a migration antes de utilizar esta função.</p>}
        {wholesaleQuery.isSuccess && <><p className="text-sm">Situação: <strong>{wholesalePermission?.active ? "Autorizado" : "Não autorizado"}</strong></p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={wholesaleMutation.isPending || !selected?.active || selectedPartner?.status !== "approved"} onClick={() => wholesaleMutation.mutate(true)}>Liberar atacado</Button>
            <Button variant="outline" disabled={wholesaleMutation.isPending || !wholesalePermission?.active} onClick={() => wholesaleMutation.mutate(false)}>Revogar atacado</Button>
          </div></>}
      </div>}
      {selectablePartners.length === 0 && <p className="text-sm text-muted-foreground">Nenhum parceiro aprovado ou com autorização ativa.</p>}
    </section>}
  </main>;
}
