import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Zap, TrendingUp, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl space-y-8 pb-safe">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Data Intelligence</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Neural Analytics</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto overflow-x-auto pb-2 scrollbar-hide">
          {[
            { label: 'Total Events', val: '24.8k', icon: Activity },
            { label: 'Conversion', val: '3.2%', icon: Zap },
            { label: 'ROI', val: '+142%', icon: TrendingUp },
            { label: 'Signals', val: '1.2k', icon: BarChart3 },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl bg-glass border border-glass-border backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon size={12} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-xl font-black italic uppercase tracking-tighter">{stat.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-glass-fallback border border-glass-border rounded-[2.5rem] backdrop-blur-xl overflow-hidden shadow-2xl reveal-on-scroll">
        <div className="p-8 border-b border-glass-border">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Live Signal Stream</h3>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-glass-border">
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground py-6 pl-8">Event Type</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Operator ID</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Intelligence Payload</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground text-right pr-8">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-glass-border">
                  <TableCell className="pl-8 py-6"><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell className="text-right pr-8"><div className="h-4 w-20 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                </TableRow>
              ))
            ) : events?.map((event) => (
              <TableRow key={event.id} className="hover:bg-white/5 border-glass-border transition-colors group">
                <TableCell className="font-bold py-6 pl-8">
                  <Badge className={`rounded-full px-3 py-0.5 text-[9px] font-black uppercase border-primary/20 ${
                    event.event_type.includes('CLICK') ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'
                  }`}>
                    {event.event_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-bold font-mono text-muted-foreground">
                  {event.user_id?.slice(0, 12)}...
                </TableCell>
                <TableCell className="text-[10px] font-bold text-muted-foreground truncate max-w-xs">
                  {JSON.stringify(event.metadata)}
                </TableCell>
                <TableCell className="text-right pr-8 font-bold tabular-nums text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleTimeString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
