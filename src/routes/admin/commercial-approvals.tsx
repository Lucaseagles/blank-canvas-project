import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCommercialApprovalsAdmin, decideCommercialApprovalAdmin } from "@/lib/commercial-approvals.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/commercial-approvals")({ component: CommercialApprovals });

type Profile = {
  id: string;
  user_id: string;
  audience: "merchant" | "partner";
  partner_type: string | null;
  display_name: string;
  business_name: string | null;
  instagram_handle: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function CommercialApprovals() {
  const load = useServerFn(getCommercialApprovalsAdmin);
  const decide = useServerFn(decideCommercialApprovalAdmin);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const query = useQuery({ queryKey: ["commercial-approvals-admin"], queryFn: () => load() });
  const mutation = useMutation({
    mutationFn: (input: { id: string; decision: "approved" | "rejected" }) => decide({ data: input }),
    onSuccess: () => {
      toast.success("Solicitação analisada");
      void queryClient.invalidateQueries({ queryKey: ["commercial-approvals-admin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const profiles = (query.data ?? []) as Profile[];
  const visible = profiles.filter(profile => profile.status === filter);
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-28">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-primary">Hub Eagles · Admin Master</p>
        <h1 className="mt-3 text-4xl font-black">Aprovação comercial</h1>
        <p className="mt-3 text-muted-foreground">Analise solicitações de lojistas e parceiros. A aprovação de lojistas libera a consulta ao catálogo B2B; não cria pedidos nem comissões.</p>
      </header>
      <div className="flex flex-wrap gap-2" aria-label="Filtrar solicitações">
        {(["pending", "approved", "rejected"] as const).map(status => (
          <Button key={status} variant={filter === status ? "default" : "outline"} onClick={() => setFilter(status)}>
            {status === "pending" ? "Pendentes" : status === "approved" ? "Aprovadas" : "Rejeitadas"}
            {" "}({profiles.filter(profile => profile.status === status).length})
          </Button>
        ))}
      </div>
      {query.isLoading && <p role="status">Carregando solicitações...</p>}
      {query.isError && <div role="alert" className="space-y-3">
        <p>Não foi possível carregar as solicitações. Verifique o acesso de Admin Master.</p>
        <Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button>
      </div>}
      {!query.isLoading && !query.isError && visible.length === 0 && (
        <p className="rounded-2xl border border-white/10 p-6 text-muted-foreground">Nenhuma solicitação nesta situação.</p>
      )}
      {!query.isLoading && !query.isError && (
        <section className="grid gap-4 md:grid-cols-2" aria-label="Solicitações comerciais">
          {visible.map(profile => (
            <article key={profile.id} className="space-y-3 rounded-2xl border border-white/10 bg-card/80 p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold">{profile.display_name}</h2>
                <span className="text-xs font-semibold uppercase text-primary">{profile.audience === "merchant" ? "Lojista" : "Parceiro"}</span>
              </div>
              {profile.business_name && <p className="text-sm">Empresa: {profile.business_name}</p>}
              {profile.partner_type && <p className="text-sm">Perfil: {profile.partner_type}</p>}
              {profile.instagram_handle && <p className="text-sm">Instagram: {profile.instagram_handle}</p>}
              <p className="text-xs text-muted-foreground">Solicitado em {new Date(profile.created_at).toLocaleDateString("pt-BR")}</p>
              {profile.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <Button disabled={mutation.isPending} onClick={() => {
                    if (window.confirm(`Aprovar a solicitação de ${profile.display_name}?`)) mutation.mutate({ id: profile.id, decision: "approved" });
                  }}>Aprovar</Button>
                  <Button variant="outline" disabled={mutation.isPending} onClick={() => {
                    if (window.confirm(`Rejeitar a solicitação de ${profile.display_name}?`)) mutation.mutate({ id: profile.id, decision: "rejected" });
                  }}>Rejeitar</Button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
