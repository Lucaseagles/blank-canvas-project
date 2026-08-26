import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminIntelligenceData } from "../../lib/admin_intel.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ShoppingBag, 
  Play, 
  Heart, 
  Bell, 
  MousePointer2, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus
} from "lucide-react";

import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useState, useEffect } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [days, setDays] = useState(7);
  const getDashboardData = useServerFn(getAdminIntelligenceData);
  
  const { data, isLoading } = useSuspenseQuery({
    queryKey: ["admin-dashboard", days],
    queryFn: () => getDashboardData({ data: { days } }),
  });

  // Client-side hydration safety for dates
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const kpiCards = [
    { 
      title: "Total Users", 
      value: data.kpis.users.total, 
      subValue: `${data.kpis.users.new} new`, 
      icon: Users, 
      color: "text-blue-500",
      trend: data.kpis.users.new >= data.kpis.users.prevNew ? 'up' : 'down'
    },
    { 
      title: "Products", 
      value: data.kpis.products.total, 
      subValue: `${data.kpis.products.published} active`, 
      icon: ShoppingBag, 
      color: "text-primary" 
    },
    { 
      title: "Videos", 
      value: data.kpis.videos.published, 
      subValue: "Active videos", 
      icon: Play, 
      color: "text-purple-500" 
    },
    { 
      title: "Clicks", 
      value: data.kpis.clicks.period, 
      subValue: "Outbound", 
      icon: MousePointer2, 
      color: "text-green-500",
      trend: data.kpis.clicks.period >= data.kpis.clicks.prevPeriod ? 'up' : 'down'
    },
    { 
      title: "Favorites", 
      value: data.kpis.favorites.total, 
      subValue: "New favorites", 
      icon: Heart, 
      color: "text-pink-500" 
    },
    { 
      title: "CTR", 
      value: `${data.kpis.ctr.toFixed(2)}%`, 
      subValue: "Click-through rate", 
      icon: TrendingUp, 
      color: "text-orange-500" 
    },
    { 
      title: "Referrals", 
      value: (data as any).kpis.referrals.total, 
      subValue: `${(data as any).kpis.referrals.activated} activated`, 
      icon: UserPlus, 
      color: "text-indigo-500" 
    },
  ];


  // Prepare chart data
  const marketplaceColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="container mx-auto py-8 lg:py-12 px-4 lg:px-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3 uppercase tracking-tighter">Command Center</Badge>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic leading-none">Intelligence Hub</h1>
        </div>
        
        <div className="flex items-center gap-3 bg-glass-fallback border-glass-border backdrop-blur-xl p-2 rounded-2xl w-full md:w-auto">
          <Calendar className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-full md:w-[180px] border-none bg-transparent font-bold uppercase tracking-widest text-xs focus:ring-0">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent className="bg-glass-fallback backdrop-blur-2xl border-glass-border rounded-xl">
              <SelectItem value="7" className="uppercase tracking-widest text-xs font-bold">Last 7 Days</SelectItem>
              <SelectItem value="30" className="uppercase tracking-widest text-xs font-bold">Last 30 Days</SelectItem>
              <SelectItem value="90" className="uppercase tracking-widest text-xs font-bold">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="bg-glass-fallback border-glass-border backdrop-blur-xl rounded-3xl p-4 lg:p-8 group hover:shadow-elevation-2 transition-all duration-500 min-h-[140px] flex flex-col justify-between">
            <CardHeader className="p-0 pb-2 lg:pb-6 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-muted-foreground">{kpi.title}</CardTitle>
              <div className="p-2 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
                <kpi.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-1 lg:space-y-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl lg:text-5xl font-black tracking-tighter italic break-all">{kpi.value.toLocaleString()}</span>
                {kpi.trend && (
                  <span className={`flex items-center text-[10px] font-bold ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {kpi.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{kpi.subValue}</p>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Click History Chart */}
        <Card className="bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2rem] lg:rounded-4xl p-4 lg:p-8 overflow-hidden">

          <CardHeader className="p-0 pb-8">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Outbound Clicks Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.charts.clickHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis 
                  dataKey="day" 
                  tick={{fontSize: 10, fontWeight: 900}} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                />
                <YAxis tick={{fontSize: 10, fontWeight: 900}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-popover)', 
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: '16px',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--color-primary)" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'var(--color-background)' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card className="bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2rem] lg:rounded-4xl p-4 lg:p-8 overflow-hidden">
          <CardHeader className="p-0 pb-8">
            <CardTitle className="text-sm font-black uppercase tracking-widest">System Adoption (New Users)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis 
                  dataKey="day" 
                  tick={{fontSize: 10, fontWeight: 900}} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                />
                <YAxis tick={{fontSize: 10, fontWeight: 900}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-popover)', 
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: '16px',
                    fontSize: '10px',
                    fontWeight: 900
                  }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* "Awaiting Integration" Info Banner */}
      <Card className="bg-blue-500/5 border-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border-dashed">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <AlertCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-500">External Sync Pipeline</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">The following metrics are marked as <span className="text-blue-500 font-bold italic">"Pending Integration"</span> and will be activated upon marketplace API handshake.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Commission Revenue", reason: "Marketplace API needed" },
                { label: "Conversion Rate", reason: "Pixel validation pending" },
                { label: "Real-time Stock", reason: "Inventory Sync needed" },
                { label: "Validated Sales", reason: "Post-back integration" }
              ].map((item) => (
                <div key={item.label} className="bg-background/50 border border-glass-border p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground opacity-50">{item.label}</p>
                  <p className="text-xs font-bold text-blue-500 italic mt-1">Waiting Sync...</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-2">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between pt-4">
        {mounted && (
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Last synchronization: {new Date(data.timestamp).toLocaleString()}
          </p>
        )}
        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter opacity-50 border-glass-border">System v2.8.0-INTEL</Badge>
      </div>
    </div>
  );
}
