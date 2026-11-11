import {useState} from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {listRubiMasterCandidatesAdmin,proposeRubiMasterCandidateAdmin,cancelRubiMasterCandidateAdmin} from "@/lib/rubi-master-candidates.functions";

export function RubiMasterAccessAdmin(){
 const [email,setEmail]=useState("");
 const list=useServerFn(listRubiMasterCandidatesAdmin);
 const propose=useServerFn(proposeRubiMasterCandidateAdmin);
 const cancel=useServerFn(cancelRubiMasterCandidateAdmin);
 const client=useQueryClient();
 const query=useQuery({queryKey:["rubi-master-candidates"],queryFn:()=>list(),retry:false});
 const mutation=useMutation({
  mutationFn:()=>propose({data:{email:email.trim().toLowerCase()}}),
  onSuccess:()=>{toast.success("Candidato registrado sem conceder acesso.");setEmail("");void client.invalidateQueries({queryKey:["rubi-master-candidates"]});},
  onError:(error:Error)=>toast.error(error.message)
 });
 const cancellation=useMutation({
  mutationFn:(candidateEmail:string)=>cancel({data:{email:candidateEmail}}),
  onSuccess:()=>{toast.success("Cadastro futuro cancelado.");void client.invalidateQueries({queryKey:["rubi-master-candidates"]});},
  onError:(error:Error)=>toast.error(error.message)
 });
 return <section className="space-y-4 rounded-3xl border border-primary/30 bg-card p-6" aria-label="Controle do Master principal">
   <div>
    <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI · Segurança administrativa</p>
    <h2 className="mt-1 text-2xl font-black">Master principal · acesso exclusivo</h2>
    <p className="mt-2 text-sm text-muted-foreground">O acesso Master continua exclusivo do proprietário com papel owner. A lista abaixo apenas prepara cadastros futuros; ninguém adquire acesso ao ser registrado aqui.</p>
   </div>
   <div className="rounded-xl border p-4 text-sm">
    <p className="font-semibold">Segurança desta etapa</p>
    <p className="mt-1 text-muted-foreground">Nenhuma delegação está ativa por este recurso. Ativar novos Masters dependerá de uma sprint específica de permissões, testes negativos e sua decisão explícita.</p>
   </div>
   <form className="flex flex-wrap items-end gap-2" onSubmit={event=>{event.preventDefault();if(!window.confirm("Registrar apenas como candidato futuro, sem qualquer acesso ao Master?"))return;mutation.mutate();}}>
    <label className="min-w-[240px] flex-1 space-y-1 text-sm font-medium">E-mail para cadastro futuro
     <input type="email" required maxLength={254} autoComplete="off" className="w-full rounded-lg border bg-background p-2" value={email} onChange={event=>setEmail(event.target.value)} placeholder="contato@exemplo.com"/>
    </label>
    <Button type="submit" disabled={mutation.isPending||!email.trim()}>{mutation.isPending?"Registrando...":"Registrar sem conceder acesso"}</Button>
   </form>
   {query.isLoading&&<p role="status" className="text-sm">Carregando registros...</p>}
   {query.isError&&<p role="alert" className="text-sm text-destructive">Falha ao consultar o controle. Verifique a migração e as permissões.</p>}
   {query.data?.candidates.length===0&&<p className="text-sm text-muted-foreground">Nenhum candidato a Master cadastrado. O acesso atual permanece exclusivo.</p>}
   {query.data?.candidates.map(candidate=><div key={candidate.email} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
    <div><p className="break-all font-medium">{candidate.email}</p><p className="text-xs text-muted-foreground">{candidate.status==="pending"?"Pré-cadastro pendente, sem acesso":"Pré-cadastro cancelado, sem acesso"}</p></div>
    {candidate.status==="pending"&&<Button variant="outline" size="sm" disabled={cancellation.isPending} onClick={()=>{if(window.confirm("Cancelar o pré-cadastro deste e-mail?"))cancellation.mutate(candidate.email);}}>Cancelar registro</Button>}
   </div>)}
 </section>;
}
