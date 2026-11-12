import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {BookOpen,ShieldCheck,Users,ClipboardList} from "lucide-react";
import {Button} from "@/components/ui/button";
import {listRubiTeamCampaignAssignmentsAdmin} from "@/lib/rubi-team-campaign-assignments.functions";
import {getRubiTeamOfferKitAdmin} from "@/lib/rubi-team-offer-kit.functions";

type Assignment={id:string;team_id:string;campaign_plan_id:string;status:string};
type Team={id:string;name:string;niche:string};
type Plan={id:string;campaign_code:string};
type Checklist={name:string;ok:boolean};
function TextField({label,value}:{label:string;value:string}){
 return <div className="space-y-1 rounded-xl border bg-background/70 p-3">
  <p className="text-xs font-bold text-muted-foreground">{label}</p>
  <p className="whitespace-pre-line text-sm leading-6">{value.trim()||"Não preenchido"}</p>
 </div>;
}
/** Owner-only preview. Copy is intentionally not exposed to partner login. */
export function RubiTeamOfferKitAdmin(){
 const loadAssignments=useServerFn(listRubiTeamCampaignAssignmentsAdmin);
 const loadKit=useServerFn(getRubiTeamOfferKitAdmin);
 const [assignmentId,setAssignmentId]=useState("");
 const catalog=useQuery({queryKey:["rubi-team-campaign-assignments"],queryFn:()=>loadAssignments(),retry:false});
 const report=useQuery({queryKey:["rubi-master-team-offer-kit",assignmentId],
  queryFn:()=>loadKit({data:{assignmentId}}),enabled:!!assignmentId,retry:false,staleTime:30000});
 const assignments=(catalog.data?.assignments??[]) as Assignment[];
 const teams=(catalog.data?.teams??[]) as Team[];
 const plans=(catalog.data?.plans??[]) as Plan[];
 const kit=report.data;
 return <section aria-label="Kit da oferta da Store para os times de influenciadores" className="space-y-5 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <header className="space-y-2">
   <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary"><BookOpen className="h-4 w-4"/> RUBI Store × RUBI Partners</p>
   <h2 className="text-xl font-black">Kit conectado: oferta, funil, movimento e time</h2>
   <p className="text-sm leading-6 text-muted-foreground">Visualize o mesmo produto, proposta, página, roteiro e criativo da loja em uma campanha atribuída ao time. É um material de revisão privado do Master; não publica nem libera comissões.</p>
  </header>
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
   <label className="flex-1 space-y-1 text-xs font-semibold">Campanha de time
    <select className="block w-full rounded-xl border bg-background p-2.5" value={assignmentId} onChange={e=>setAssignmentId(e.target.value)}>
     <option value="">Escolher associação existente</option>
     {assignments.map(a=><option key={a.id} value={a.id}>{teams.find(t=>t.id===a.team_id)?.name??"Time"} · {plans.find(p=>p.id===a.campaign_plan_id)?.campaign_code??a.id.slice(0,8)} · {a.status}</option>)}
    </select>
   </label>
   <Button variant="outline" type="button" onClick={()=>{void catalog.refetch();if(assignmentId)void report.refetch();}} disabled={catalog.isFetching||report.isFetching}>Atualizar dados</Button>
  </div>
  {catalog.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível carregar os times. Verifique acesso Master.</p>}
  {catalog.data&&assignments.length===0&&<p className="text-sm text-muted-foreground">Nenhuma associação encontrada. Prepare antes o produto, movimento, variante e o plano do time.</p>}
  {catalog.data?.partial&&<p role="status" className="text-xs text-amber-600">Lista de associações incompleta: selecione somente registros identificados na consulta.</p>}
  {report.isFetching&&<p role="status" className="text-sm text-muted-foreground">Conferindo produto, equipe, materiais e autorizações...</p>}
  {report.isError&&<p role="alert" className="text-sm text-destructive">Kit indisponível: há referência ausente, inválida ou não autorizada.</p>}
  {kit&&!report.isFetching&&<div className="space-y-4">
   <div className="rounded-2xl border bg-background/60 p-4">
    <h3 className="text-lg font-black">{kit.product.title}</h3>
    <p className="text-sm text-muted-foreground">{kit.product.category} · {kit.campaign.code}</p>
    <p className="mt-2 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary"/>{kit.team.name} · Nicho {kit.team.niche}</p>
    <p className="text-xs text-muted-foreground">Correspondência de nicho e produto exige aprovação humana: nenhuma categoria é considerada adequada automaticamente.</p>
   </div>
   <div className="grid gap-3 lg:grid-cols-2">
    <div className="space-y-2"><h4 className="flex items-center gap-2 font-black"><ClipboardList className="h-4 w-4"/> Oferta da Store</h4>
     <TextField label="Promessa principal" value={kit.offer?.promise??""}/>
     <TextField label="Benefícios verificáveis" value={kit.offer?.benefits??""}/>
     <TextField label="Provas e fontes" value={kit.offer?.proof??""}/>
     <TextField label="Objeções" value={kit.offer?.objections??""}/>
     <p className="text-xs text-muted-foreground">Checklist da oferta: {kit.offer?.score??0}% · Canais: {kit.offer?.channels.join(", ")||"Não definidos"}</p>
    </div>
    <div className="space-y-2"><h4 className="font-black">Movimento e variante de divulgação</h4>
     <TextField label="Público / persona" value={kit.movement.persona}/>
     <TextField label="Problema e resultado desejado" value={kit.movement.problem+"\n"+kit.movement.outcome}/>
     <TextField label="Gancho para o criativo" value={kit.variant.hook}/>
     <TextField label="Roteiro autorizado" value={kit.variant.script}/>
     <TextField label="Headline e texto da página" value={kit.variant.headline+"\n"+kit.variant.page}/>
     <TextField label="Chamada para ação" value={kit.variant.cta}/>
    </div>
   </div>
   <div className="space-y-2 rounded-2xl border bg-background/60 p-4">
    <h4 className="font-black">Checklist antes de preparar a distribuição</h4>
    {(kit.checks as Checklist[]).map(item=><p className="flex items-center gap-2 text-sm" key={item.name}><span aria-label={item.ok?"Conferido":"Pendente"}>{item.ok?"✓":"○"}</span>{item.name}</p>)}
    <p className="text-xs text-muted-foreground">Integrantes com cadastro aprovado, grant e link ativo: {kit.authorizedMembers===null?"Indeterminado por limites de consulta":kit.authorizedMembers}. Não é número de vendas ou contratos com comissão acordada.</p>
    <p className="text-xs font-semibold">{kit.readyForEditorialHandoff?"Todos os requisitos automáticos conferidos. Faça ainda a revisão humana do nicho e das condições comerciais.":"O kit ainda possui requisitos técnicos pendentes. Não distribuir."}</p>
   </div>
   <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary"/>{kit.caution} O percentual comercial deve ser definido por acordo individual e margem real, não pelo modelo de apresentação do kit.</p>
  </div>}
 </section>;
}
