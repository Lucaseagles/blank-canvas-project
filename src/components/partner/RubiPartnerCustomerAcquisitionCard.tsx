import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {supabase} from "@/integrations/supabase/client";
import {getMyPartnerCustomerAcquisitionStats} from "@/lib/rubi-partner-customer-acquisition.functions";
import {Users,ShieldCheck,Clock3} from "lucide-react";

export function RubiPartnerCustomerAcquisitionCard(){
 const load=useServerFn(getMyPartnerCustomerAcquisitionStats);
 const query=useQuery({
  queryKey:["my-partner-customer-acquisitions"],
  queryFn:async()=>{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error("Entre na sua conta.");
   return load({data:{accessToken:session.access_token}});
  },
  retry:false
 });
 const stats=query.data;
 return <section aria-label="Clientes conquistados por você" className="space-y-4 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-5 sm:p-7">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div className="space-y-1">
    <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI · Aquisição de clientes</p>
    <h2 className="text-2xl font-black">Sua rede de clientes</h2>
    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Quando alguém cria uma conta pelo seu convite elegível, a origem fica vinculada a você por 90 dias. Se a pessoa comprar um produto que você esteja autorizado a divulgar, a futura integração de checkout poderá consultar essa origem.</p>
   </div>
   <Users aria-hidden="true" className="h-8 w-8 text-primary"/>
  </div>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Carregando suas indicações...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível carregar os dados de aquisição.</p>}
  {stats&&<div className="grid gap-3 sm:grid-cols-3">
   <div className="rounded-2xl border bg-background/80 p-4">
    <p className="text-xs text-muted-foreground">Cadastros atribuídos</p>
    <p className="mt-1 text-3xl font-black tabular-nums">{stats.total}</p>
   </div>
   <div className="rounded-2xl border bg-background/80 p-4">
    <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4"/> Janela ativa</p>
    <p className="mt-1 text-3xl font-black tabular-nums">{stats.active}</p>
   </div>
   <div className="rounded-2xl border bg-background/80 p-4">
    <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4"/> Janela encerrada</p>
    <p className="mt-1 text-3xl font-black tabular-nums">{stats.expired}</p>
   </div>
  </div>}
  <p className="text-xs leading-5 text-muted-foreground">Cadastro atribuído não é venda. Comissão só poderá ser registrada após uma compra elegível, confirmação confiável do pagamento e validação das regras comerciais. O comprador não paga mais por ter usado um convite.</p>
 </section>;
}
