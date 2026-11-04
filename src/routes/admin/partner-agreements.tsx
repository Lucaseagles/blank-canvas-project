import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPartnerAgreementsAdmin, setPartnerAgreementAdmin } from "@/lib/partner-agreements-admin.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/partner-agreements")({ component: PartnerAgreementsAdmin });

type Profile = { id: string; display_name: string; partner_type: string; status: string };
type Agreement = { commercial_profile_id: string; commission_percent: number; active: boolean };

function PartnerAgreementsAdmin() {
  const load = useServerFn(getPartnerAgreementsAdmin);
  const save = useServerFn(setPartnerAgreementAdmin);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-partner-agreements"], queryFn: () => load(), retry: false });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const mutation = useMutation({
    mutationFn: (data: { commercial_profile_id: string; commission_percent: number; active: boolean }) => save({ data }),
    onSuccess: () => { toast.success("Acordo atualizado."); void queryClient.invalidateQueries({ queryKey: ["admin-partner-agreements"] }); },
    onError: (error: Error) => toast.error(error.message),
  });
  const profiles = (query.data?.profiles ?? []) as Profile[];
  const agreements = (query.data?.agreements ?? []) as Agreement[];
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-28">
    <header><p className="text-xs font-bold uppercase tracking-widest text-primary">Shadow Master · Parceiros</p><h1 className="text-3xl font-black">Acordos comerciais</h1><p className="text-muted-foreground">Defina percentuais por parceiro. Apenas o Admin Master pode alterar os acordos.</p></header>
    {query.isLoading && <p role="status">Carregando acordos...</p>}
    {query.isError && <div role="alert" className="space-y-3"><p>Acesso restrito ou falha ao carregar acordos.</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {query.isSuccess && profiles.length === 0 && <p className="rounded-xl border p-6">Nenhum parceiro cadastrado.</p>}
    <section aria-label="Acordos por parceiro" className="space-y-4">
      {profiles.map(profile => {
        const agreement = agreements.find(item => item.commercial_profile_id === profile.id);
        const percent = drafts[profile.id] ?? String(agreement?.commission_percent ?? 0);
        const numeric = Number(percent);
        const valid = percent.trim() !== "" && Number.isFinite(numeric) && numeric >= 0 && numeric <= 100;
        return <article key={profile.id} className="flex flex-wrap items-end gap-4 rounded-2xl border bg-card p-5">
          <div className="min-w-48 flex-1"><h2 className="font-bold">{profile.display_name}</h2><p className="text-sm text-muted-foreground">{profile.partner_type} · {profile.status}</p></div>
          <label className="space-y-1 text-sm"><span className="block">Comissão (%)</span><input className="w-28 rounded-md border bg-background px-3 py-2" type="number" min="0" max="100" step="0.01" value={percent} onChange={event => setDrafts(current => ({ ...current, [profile.id]: event.target.value }))} /></label>
          <Button variant="outline" disabled={!valid || mutation.isPending} onClick={() => mutation.mutate({ commercial_profile_id: profile.id, commission_percent: numeric, active: false })}>Salvar inativo</Button>
          <Button disabled={profile.status !== "approved" || !valid || mutation.isPending} onClick={() => mutation.mutate({ commercial_profile_id: profile.id, commission_percent: numeric, active: true })}>Salvar e ativar</Button>
          {agreement && <p className="w-full text-xs text-muted-foreground">Estado atual: {agreement.active ? "Ativo" : "Inativo"} · {agreement.commission_percent}%</p>}
        </article>;
      })}
    </section>
    <p className="text-xs text-muted-foreground">A alteração do percentual não recalcula comissões de vendas já confirmadas. Pagamentos dependem de processo financeiro separado.</p>
  </main>;
}
