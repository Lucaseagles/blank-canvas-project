import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getChannelStrategyMatrix } from "@/lib/channel-strategy-matrix.functions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Layers3, Radio, Target } from "lucide-react";

export const Route = createFileRoute("/admin/channel-strategy-matrix")({ component: ChannelStrategyMatrixPage });

function ChannelStrategyMatrixPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["channel-strategy-matrix"], queryFn: getChannelStrategyMatrix });
  const totals = data?.totals ?? { strategies: 0, channels: 0, collections: 0, campaigns: 0 };

  return <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
    <header>
      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary">Channel Strategy Matrix</Badge>
      <h1 className="mt-2 text-4xl font-black uppercase italic tracking-tighter">Canais × <span className="text-primary">Objetivos</span></h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Visão operacional das estratégias sociais ativas por canal, objetivo, frequência, prioridade, coleções e campanhas. Os dados vêm das estratégias existentes.</p>
    </header>

    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[["Estratégias", totals.strategies, Target], ["Canais", totals.channels, Radio], ["Coleções ligadas", totals.collections, Layers3], ["Campanhas ligadas", totals.campaigns, BarChart3]].map(([label, value, Icon]) => <Card key={String(label)} className="rounded-2xl"><CardContent className="p-4"><Icon className="mb-2 h-4 w-4 text-primary"/><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black">{Number(value).toLocaleString("pt-BR")}</p></CardContent></Card>)}
    </div>

    <Card className="overflow-hidden rounded-[2rem]">
      <CardHeader><CardTitle className="text-lg font-black uppercase">Matriz operacional</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        {isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando matriz...</p> : isError ? <p className="py-10 text-center text-sm text-destructive">Não foi possível carregar a matriz.</p> : data?.channels.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma estratégia ativa configurada.</p> : <table className="w-full min-w-[900px] border-collapse text-sm"><thead><tr className="border-b"><th className="p-3 text-left text-[10px] font-black uppercase tracking-widest">Canal</th>{data?.objectives.map((objective) => <th key={objective} className="p-3 text-left text-[10px] font-black uppercase tracking-widest">{objective}</th>)}</tr></thead><tbody>{data?.channels.map((channel) => <tr key={channel.channel_id} className="border-b last:border-0"><td className="p-3"><p className="font-black uppercase">{channel.channel_name}</p><p className="text-[10px] text-muted-foreground">{channel.platform}</p></td>{data.objectives.map((objective) => { const cell = channel.objectives[objective]; return <td key={objective} className="p-3 align-top">{cell ? <div className="min-w-[125px] rounded-xl border p-3"><p className="font-black">{cell.count} estratégia(s)</p><p className="mt-1 text-[10px] text-muted-foreground">{cell.frequency} posts/semana</p><p className="text-[10px] text-muted-foreground">Prioridade máx. {cell.priority}</p><p className="text-[10px] text-muted-foreground">{cell.collections} coleção · {cell.campaigns} campanha</p></div> : <span className="text-xs text-muted-foreground">—</span>}</td>; })}</tr>)}</tbody></table>}
      </CardContent>
    </Card>

    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">A matriz é somente leitura. Alterações continuam no módulo Social Strategy; publicação continua no motor existente.</p>
  </div>;
}
