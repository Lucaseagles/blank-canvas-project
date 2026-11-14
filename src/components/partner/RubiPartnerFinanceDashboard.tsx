import {Link} from "@tanstack/react-router";
type Summary={sales:number;grossAmount:number;commissionAmount:number;agreementPercent:number|null};
type Commission={calculated:number;paid:number;pending:number;paidSales:number;unpaidSales:number};
type Visits={links:number;visits:number};
const money=(n:number)=>Number(n).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const category:Record<string,string>={
 affiliate:"Afiliado",micro_influencer:"Nano / Microinfluenciador",
 influencer:"Influenciador",expert:"Expert"
};
export function RubiPartnerFinanceDashboard({partnerType,displayName,summary,commission,visits}:{
 partnerType:string;displayName:string;summary:Summary;commission:Commission;visits:Visits;
}){
 const metrics=[
  {label:"Vendas confirmadas",value:summary.sales.toLocaleString("pt-BR"),sub:"Pedidos verificados e atribuídos"},
  {label:"Volume vendido",value:money(summary.grossAmount),sub:"Valor bruto dos pedidos atribuídos"},
  {label:"Comissão calculada",value:money(commission.calculated),sub:"Ainda não significa repasse efetuado"},
  {label:"Comissão paga",value:money(commission.paid),sub:"Baixas financeiras registradas"},
  {label:"Comissão pendente",value:money(commission.pending),sub:"Pode incluir valores ainda sujeitos à conferência"},
  {label:"Acordo vigente",value:summary.agreementPercent===null?"Não definido":summary.agreementPercent+"%",sub:"Percentual contratual, não bônus automático"}
 ];
 const paid=Math.max(0,Number(commission.paid)||0);
 const calculated=Math.max(0,Number(commission.calculated)||0);
 const paidFraction=calculated>0?Math.max(0,Math.min(100,paid/calculated*100)):0;
 return <section aria-label="Dashboard financeiro de todos os tipos de parceiros"
  className="space-y-5 rounded-3xl border border-primary/25 bg-card p-5 sm:p-7">
  <div className="space-y-2">
   <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI Partners · Financeiro privado</p>
   <h2 className="text-2xl font-black">Seu painel financeiro</h2>
   <p className="text-sm text-muted-foreground">{displayName} · {category[partnerType]??"Parceiro"}.
    Dados isolados por sua conta comercial aprovada. A mesma prestação de contas vale para todas as categorias de parceiros.</p>
  </div>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   {metrics.map(m=><div key={m.label} className="rounded-xl border bg-background p-4">
    <p className="text-xs text-muted-foreground">{m.label}</p>
    <p className="mt-1 break-words text-xl font-black">{m.value}</p>
    <p className="mt-1 text-[11px] text-muted-foreground">{m.sub}</p>
   </div>)}
  </div>
  <div className="space-y-2 rounded-xl border bg-background p-4">
   <div className="flex justify-between gap-3 text-xs font-semibold">
    <span>Comissões já pagas / calculadas</span><span>{paidFraction.toFixed(1)}%</span>
   </div>
   <div role="progressbar" aria-label="Proporção de comissões pagas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={paidFraction}
    className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:paidFraction+"%"}}/></div>
   <p className="text-xs text-muted-foreground">{commission.paidSales} vendas com comissão integralmente paga · {commission.unpaidSales} com pagamento pendente ou parcial.</p>
  </div>
  <div className="grid gap-3 sm:grid-cols-2">
   <div className="rounded-xl border p-4">
    <p className="text-xs text-muted-foreground">Links atualmente disponíveis</p>
    <p className="text-2xl font-black">{visits.links}</p>
   </div>
   <div className="rounded-xl border p-4">
    <p className="text-xs text-muted-foreground">Visitas aos links disponíveis</p>
    <p className="text-2xl font-black">{visits.visits}</p>
   </div>
  </div>
  <p className="text-xs text-muted-foreground">Os dados de visitas podem ter período e elegibilidade diferentes dos pedidos históricos. Por isso, não calculamos uma taxa de conversão entre essas duas contagens. Clicks não provam vendas: somente pedidos confirmados e vinculados a um link autorizado entram no financeiro.</p>
  <div className="flex flex-wrap gap-3 text-sm">
   <Link to="/partner/statement" className="font-semibold text-primary underline underline-offset-4">Histórico de pedidos, comissões e repasses</Link>
   <Link to="/partner/notifications" className="font-semibold text-primary underline underline-offset-4">Notificações financeiras</Link>
  </div>
 </section>;
}
