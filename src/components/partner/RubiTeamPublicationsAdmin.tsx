import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {ClipboardCheck,ExternalLink,ShieldCheck} from "lucide-react";
import {listRubiTeamPublicationsAdmin,registerRubiTeamPublicationAdmin,reviewRubiTeamPublicationAdmin} from "@/lib/rubi-team-publications.functions";
import {getRubiPublicationAuthorizedReferralsAdmin} from "@/lib/rubi-publication-referrals.functions";

type Assignment={id:string;team_id:string;variant_id:string;status:string};
type Member={id:string;team_id:string;commercial_profile_id:string;status:string};
type Profile={id:string;display_name:string};
type Evidence={id:string;assignment_id:string;membership_id:string;channel:string;publication_url:string;published_at:string;review_status:string;review_notes:string};
const channels=["instagram","tiktok","youtube","facebook","pinterest","whatsapp","telegram","other"] as const;
export function RubiTeamPublicationsAdmin(){
 const list=useServerFn(listRubiTeamPublicationsAdmin);
 const register=useServerFn(registerRubiTeamPublicationAdmin);
 const review=useServerFn(reviewRubiTeamPublicationAdmin);
 const loadReferrals=useServerFn(getRubiPublicationAuthorizedReferralsAdmin);
 const qc=useQueryClient();
 const query=useQuery({queryKey:["rubi-team-publication-evidence"],queryFn:()=>list(),retry:false});
 const referrals=useQuery({queryKey:["rubi-publication-authorized-referrals"],queryFn:()=>loadReferrals(),retry:false});
 const [assignmentId,setAssignmentId]=useState(""),[membershipId,setMembershipId]=useState("");
 const [channel,setChannel]=useState<typeof channels[number]>("instagram"),[url,setUrl]=useState("");
 const [publishedAt,setPublishedAt]=useState(""),[note,setNote]=useState("");
 const assignments=(query.data?.assignments??[]) as Assignment[];
 const members=(query.data?.memberships??[]) as Member[];
 const profiles=(query.data?.profiles??[]) as Profile[];
 const publications=(query.data?.publications??[]) as Evidence[];
 const teamId=assignments.find(a=>a.id===assignmentId)?.team_id;
 const activeMembers=members.filter(m=>m.team_id===teamId&&m.status==="active"&&profiles.some(p=>p.id===m.commercial_profile_id));
 const invalidate=()=>{
  void qc.invalidateQueries({queryKey:["rubi-team-publication-evidence"]});
  void qc.invalidateQueries({queryKey:["rubi-publication-authorized-referrals"]});
 };
 const submit=useMutation({mutationFn:()=>register({data:{assignmentId,membershipId,channel,publicationUrl:url,publishedAt:new Date(publishedAt).toISOString()}}),
  onSuccess:result=>{toast.success(result.notice);setUrl("");setPublishedAt("");invalidate();},
  onError:(e:Error)=>toast.error(e.message)});
 const assess=useMutation({mutationFn:({id,status}:{id:string;status:"reviewed"|"rejected"})=>review({data:{id,status,notes:note}}),
  onSuccess:result=>{toast.success(result.notice);setNote("");invalidate();},
  onError:(e:Error)=>toast.error(e.message)});
 return <section aria-label="Evidências de distribuição pelos criadores" className="space-y-4 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <header className="space-y-2">
   <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><ClipboardCheck className="h-4 w-4"/> RUBI Partners · Publicações</p>
   <h2 className="text-xl font-black">Comprovação editorial de divulgação</h2>
   <p className="text-sm text-muted-foreground">Registre a referência pública de um criativo divulgado por um parceiro aprovado. Revisar o endereço não comprova alcance, vendas nem comissão.</p>
  </header>
  <form onSubmit={e=>{e.preventDefault();if(assignmentId&&membershipId&&publishedAt&&!Number.isNaN(Date.parse(publishedAt)))submit.mutate();}} className="grid gap-3 rounded-2xl border bg-background/60 p-4 sm:grid-cols-2">
   <label className="space-y-1 text-xs font-semibold">Campanha e time prontos
    <select required className="block w-full rounded-xl border bg-background p-2.5" value={assignmentId}
     onChange={e=>{setAssignmentId(e.target.value);setMembershipId("");}}>
     <option value="">Escolha uma associação</option>{assignments.filter(a=>a.status==="ready").map(a=><option key={a.id} value={a.id}>{a.id.slice(0,8)} · Variante {a.variant_id.slice(0,8)}</option>)}
    </select>
   </label>
   <label className="space-y-1 text-xs font-semibold">Integrante aprovado e ativo
    <select required disabled={!assignmentId} className="block w-full rounded-xl border bg-background p-2.5" value={membershipId} onChange={e=>setMembershipId(e.target.value)}>
     <option value="">Selecione integrante</option>
     {activeMembers.map(m=><option key={m.id} value={m.id}>{profiles.find(p=>p.id===m.commercial_profile_id)?.display_name||"Criador"} · {m.id.slice(0,8)}</option>)}
    </select>
   </label>
   <label className="space-y-1 text-xs font-semibold">Canal
    <select value={channel} onChange={e=>setChannel(e.target.value as typeof channel)} className="block w-full rounded-xl border bg-background p-2.5">
     {channels.map(c=><option key={c} value={c}>{c}</option>)}
    </select>
   </label>
   <label className="space-y-1 text-xs font-semibold">Data e hora informadas da publicação
    <input required type="datetime-local" value={publishedAt} onChange={e=>setPublishedAt(e.target.value)} className="block w-full rounded-xl border bg-background p-2.5"/>
   </label>
   <label className="space-y-1 text-xs font-semibold sm:col-span-2">URL pública HTTPS da publicação
    <input required type="url" maxLength={500} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className="block w-full rounded-xl border bg-background p-2.5"/>
   </label>
   <div className="sm:col-span-2"><Button type="submit" disabled={!assignmentId||!membershipId||!url||!publishedAt||submit.isPending}>Registrar referência para revisão</Button></div>
  </form>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Consultando referências...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível consultar as publicações. Verifique migração e sessão Master.</p>}
  {query.data&&<div className="space-y-3">
   {publications.length===0&&<p className="text-sm text-muted-foreground">Nenhuma publicação registrada até o momento.</p>}
   {referrals.isError&&<p role="alert" className="text-xs text-destructive">Não foi possível verificar os links autorizados. Nenhuma indicação será presumida.</p>}
   {referrals.data?.limited&&<p role="status" className="text-xs text-amber-600">Consulta de autorizações incompleta: links ocultos por segurança.</p>}
   {publications.map(p=><article key={p.id} className="space-y-2 rounded-2xl border bg-background/60 p-4">
    <div className="flex flex-wrap justify-between gap-2"><strong className="text-xs">{p.channel} · {p.review_status==="reviewed"?"Revisada":p.review_status==="rejected"?"Rejeitada":"Aguardando revisão"}</strong><span className="text-xs text-muted-foreground">{new Date(p.published_at).toLocaleString("pt-BR")}</span></div>
    <a href={p.publication_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-xs text-primary underline">{p.publication_url}<ExternalLink className="h-3 w-3 shrink-0"/></a>
    <p className="text-xs text-muted-foreground">Associação: {p.assignment_id.slice(0,8)} · Integrante: {p.membership_id.slice(0,8)}</p>
    {p.review_notes&&<p className="text-xs">{p.review_notes}</p>}
    {p.review_status==="reviewed"&&referrals.data?.links.find(item=>item.publicationId===p.id)&&<div className="space-y-1 rounded-xl border border-primary/20 bg-primary/[0.05] p-3">
     <p className="text-xs font-semibold">Indicação oficial do parceiro para este produto</p>
     <a href={"/r/"+referrals.data.links.find(item=>item.publicationId===p.id)!.code+"?pub="+encodeURIComponent(p.id)} className="break-all text-xs text-primary underline">/r/{referrals.data.links.find(item=>item.publicationId===p.id)!.code}</a>
     <p className="text-[11px] text-muted-foreground">Link existente do parceiro com identificação desta publicação. A visita será marcada somente após validação no servidor; não comprova que o visitante viu o post. Checkout com comissão continua bloqueado até validação com o fornecedor.</p>
    </div>}
    {p.review_status==="submitted"&&<div className="space-y-2">
     <label className="block space-y-1 text-xs font-semibold">Nota de verificação (mínimo 10 caracteres)
      <textarea rows={2} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)} className="block w-full rounded-xl border bg-background p-2"/>
     </label>
     <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" disabled={note.trim().length<10||assess.isPending} onClick={()=>assess.mutate({id:p.id,status:"reviewed"})}>Revisar referência</Button>
      <Button type="button" size="sm" variant="outline" disabled={note.trim().length<10||assess.isPending} onClick={()=>assess.mutate({id:p.id,status:"rejected"})}>Rejeitar referência</Button>
     </div>
    </div>}
   </article>)}
   {query.data.partial&&<p role="status" className="text-xs text-amber-600">Resultados parciais por limite de consulta. Não usar esta lista como total completo de publicações.</p>}
  </div>}
  <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary"/> Evidência informada manualmente. A aprovação editorial não certifica visualizações, pagamentos ou vendas atribuídas e não libera gastos.</p>
 </section>;
}
