import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Store, ShoppingBag, Megaphone, CheckCircle, XCircle } from "lucide-react";
import { getCommercialProfilesAdmin, decideCommercialProfile } from "@/lib/commercial-admin.functions";
export const Route = createFileRoute("/admin/commercial-profiles")({component:CommercialProfilesAdmin});
const labels:Record<string,string>={consumer:"Consumidor",merchant:"Lojista / comerciante",partner:"Parceiro"};
const partnerLabels:Record<string,string>={micro_influencer:"Microinfluenciador",influencer:"Influenciador",affiliate:"Afiliado",expert:"Expert"};
function CommercialProfilesAdmin(){
 const client=useQueryClient();const getProfiles=useServerFn(getCommercialProfilesAdmin);const decide=useServerFn(decideCommercialProfile);
 const query=useQuery({queryKey:["admin-commercial-profiles"],queryFn:()=>getProfiles()});
 const mutation=useMutation({mutationFn:(data:{id:string;status:"approved"|"rejected"})=>decide({data}),onSuccess:()=>{void client.invalidateQueries({queryKey:["admin-commercial-profiles"]});toast.success("Solicitação atualizada");},onError:(e)=>toast.error(e.message)});
 const profiles=(query.data??[]) as Array<{id:string;audience:string;partner_type:string|null;display_name:string;business_name:string|null;instagram_handle:string|null;status:string;created_at:string}>;
 return <div className="container mx-auto min-h-screen space-y-8 px-4 py-28"><header className="space-y-3"><span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">Hub Eagles · Gestão comercial</span><h1 className="text-4xl font-black md:text-6xl">Públicos & <span className="text-primary">parceiros</span></h1><p className="text-muted-foreground">Consumidores, lojistas e divulgadores, com aprovação comercial independente.</p></header>
 <div className="grid gap-3 md:grid-cols-3">{[["consumer",ShoppingBag],["merchant",Store],["partner",Megaphone]].map(([kind,Icon])=><div key={kind as string} className="rounded-3xl border border-white/10 bg-card/80 p-6"><Icon className="mb-4 h-7 w-7 text-primary"/><div className="text-3xl font-black">{profiles.filter(p=>p.audience===kind).length}</div><div className="text-sm text-muted-foreground">{labels[kind as string]}</div></div>)}</div>
 {query.isLoading&&<p>Carregando perfis...</p>}{query.isError&&<div role="alert">Não foi possível carregar os perfis. <Button variant="outline" onClick={()=>void query.refetch()}>Tentar novamente</Button></div>}
 <div className="space-y-3">{profiles.map(p=><div key={p.id} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-card/80 p-5 md:flex-row md:items-center md:justify-between"><div className="space-y-1"><div className="text-lg font-bold">{p.display_name}</div><p className="text-sm text-muted-foreground">{labels[p.audience]}{p.partner_type?" · "+(partnerLabels[p.partner_type]??p.partner_type):""}{p.business_name?" · "+p.business_name:""}{p.instagram_handle?" · "+p.instagram_handle:""}</p><p className="text-xs text-muted-foreground">Status: {p.status} · {new Date(p.created_at).toLocaleDateString("pt-BR")}</p></div>{p.status==="pending"&&<div className="flex gap-2"><Button disabled={mutation.isPending} onClick={()=>mutation.mutate({id:p.id,status:"approved"})}><CheckCircle className="mr-2 h-4 w-4"/>Aprovar</Button><Button disabled={mutation.isPending} variant="outline" onClick={()=>mutation.mutate({id:p.id,status:"rejected"})}><XCircle className="mr-2 h-4 w-4"/>Recusar</Button></div>}</div>)}</div>
 {!query.isLoading&&!query.isError&&!profiles.length&&<p className="text-muted-foreground">Nenhuma solicitação registrada.</p>}
 </div>;
}
