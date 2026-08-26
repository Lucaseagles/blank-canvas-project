import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminReferralStats } from "@/lib/referral.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Gift, 
  TrendingUp, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2, 
  UserPlus,
  Network
} from "lucide-react";

export const Route = createFileRoute("/admin/referrals")({
  component: AdminReferralsPage,
});

function AdminReferralsPage() {
  const getStats = useServerFn(getAdminReferralStats);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-referral-stats"],
    queryFn: () => getStats({ data: {} as any }),
  });

  return (
    <div className="container mx-auto py-12 px-8 space-y-10 pb-safe">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-bold px-3 uppercase tracking-tighter">Viral Growth</Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none flex items-center gap-4">
            Network Intel
            <Network className="w-12 h-12 text-indigo-500" />
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="p-6 rounded-3xl bg-glass border border-glass-border backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-1">
              <Gift size={14} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Codes</span>
            </div>
            <p className="text-3xl font-black italic uppercase tracking-tighter">{data?.summary.totalCodes || 0}</p>
          </div>
          <div className="p-6 rounded-3xl bg-glass border border-glass-border backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus size={14} className="text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Joins</span>
            </div>
            <p className="text-3xl font-black italic uppercase tracking-tighter">{data?.summary.totalEvents || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Stats Table */}
      <div className="bg-glass-fallback border border-glass-border rounded-[2.5rem] backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-glass-border flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black italic uppercase tracking-widest text-indigo-500">Live Growth Stream</h3>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Real-time attribution monitoring</p>
          </div>
          <Badge variant="outline" className="border-glass-border text-[10px] font-black uppercase tracking-widest px-4">
            Last 50 Events
          </Badge>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-glass-border">
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground py-6 pl-8">Operator (Referrer)</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Code Used</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Target (Invited)</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground text-right pr-8">Protocol Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-glass-border">
                  <TableCell className="pl-8 py-8"><div className="h-4 w-32 bg-muted animate-pulse rounded-lg" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded-lg" /></TableCell>
                  <TableCell><div className="h-4 w-48 bg-muted animate-pulse rounded-lg" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded-lg" /></TableCell>
                  <TableCell className="text-right pr-8"><div className="h-4 w-20 ml-auto bg-muted animate-pulse rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : data?.events?.map((event) => (
              <TableRow key={event.id} className="hover:bg-white/5 border-glass-border transition-colors group">
                <TableCell className="py-8 pl-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                      <Users size={18} className="text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase italic tracking-tighter">
                        {event.referrals?.referrer_user_id?.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="bg-muted/50 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest text-foreground uppercase border border-glass-border">
                    {event.referrals?.referral_code}
                  </code>
                </TableCell>
                <TableCell className="text-xs font-bold font-mono text-muted-foreground">
                  {event.invited_user_id?.slice(0, 16)}...
                </TableCell>
                <TableCell>
                  <Badge className={`rounded-full px-4 py-1 text-[9px] font-black uppercase border-none ${
                    event.status === 'activated' 
                      ? 'bg-green-500/20 text-green-500' 
                      : event.status === 'registered' 
                      ? 'bg-blue-500/20 text-blue-500' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-8 font-black tabular-nums text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  {new Date(event.created_at).toLocaleDateString()} <br />
                  <span className="text-[9px] font-bold opacity-50">{new Date(event.created_at).toLocaleTimeString()}</span>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && data?.events?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Zap className="w-12 h-12 text-muted-foreground/20" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 italic">Waiting for the first network signal...</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Expansion Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {[
          { 
            title: "Viral Loops", 
            icon: Zap, 
            desc: "Automated reward allocation for activated operators.", 
            color: "text-amber-500" 
          },
          { 
            title: "Identity Bridge", 
            icon: CheckCircle2, 
            desc: "Zero-friction onboarding via validated invite links.", 
            color: "text-indigo-500" 
          },
          { 
            title: "Network Effects", 
            icon: TrendingUp, 
            desc: "Exponential growth tracking via neural attribution.", 
            color: "text-green-500" 
          }
        ].map((item) => (
          <Card key={item.title} className="bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2rem] p-8">
            <div className={`p-4 rounded-[1.5rem] bg-muted/50 w-fit mb-6 ${item.color}`}>
              <item.icon size={24} />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest italic mb-2">{item.title}</h4>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
              {item.desc}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
