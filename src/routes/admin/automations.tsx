import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  getAutomationRules, 
  toggleRuleStatus, 
  getAutomationLogs, 
  recalculateTrendingManual,
  runRetentionCheck,
} from "@/lib/automation.functions";
import { recalculateCategoryHighlights } from "@/lib/highlights.functions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Cpu, 
  Zap, 
  Clock, 
  History, 
  Settings2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Database,
  Search,
  RefreshCcw,
  ShieldCheck,
  Power,
  Target
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/automations")({
  component: AdminAutomationsPage,
});

function AdminAutomationsPage() {
  const queryClient = useQueryClient();
  const getRules = useServerFn(getAutomationRules);
  const getLogs = useServerFn(getAutomationLogs);
  const toggleStatus = useServerFn(toggleRuleStatus);
  const triggerTrending = useServerFn(recalculateTrendingManual);
  const triggerRetention = useServerFn(runRetentionCheck);
  const triggerCategoryHighlights = useServerFn(recalculateCategoryHighlights);


  const { data: rules } = useSuspenseQuery({
    queryKey: ["automation-rules"],
    queryFn: () => getRules({ data: undefined }),
  });

  const { data: logs } = useSuspenseQuery({
    queryKey: ["automation-logs"],
    queryFn: () => getLogs({ data: { limit: 50 } }),
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => toggleStatus({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Automation status updated");
    }
  });

  const trendingMutation = useMutation({
    mutationFn: () => triggerTrending({ data: undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-logs"] });
      toast.success("Trending engine recalculation triggered");
    }
  });

  const retentionMutation = useMutation({
    mutationFn: () => triggerRetention({ data: undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-logs"] });
      toast.success("Retention check completed");
    }
  });

  const categoryHighlightsMutation = useMutation({
    mutationFn: () => triggerCategoryHighlights({ data: undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-logs"] });
      toast.success("Category highlights recalculation triggered");
    }
  });


  return (
    <div className="container mx-auto py-12 px-8 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-4 py-1 uppercase tracking-widest text-[10px]">Neural Core</Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">
            Automation <span className="text-primary">Engine</span>
          </h1>
          <p className="text-muted-foreground font-bold tracking-tight max-w-2xl">
            Orchestrate autonomous platform logic, neural triggers, and marketplace synchronization protocols from a centralized intelligence hub.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => categoryHighlightsMutation.mutate()}
            disabled={categoryHighlightsMutation.isPending}
            variant="outline"
            className="h-14 px-8 rounded-2xl font-black uppercase tracking-tighter italic gap-2 border-glass-border bg-glass-fallback hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Target className={`w-5 h-5 ${categoryHighlightsMutation.isPending ? 'animate-pulse' : ''}`} />
            Sync Highlights
          </Button>
          <Button 
            onClick={() => retentionMutation.mutate()}

            disabled={retentionMutation.isPending}
            variant="outline"
            className="h-14 px-8 rounded-2xl font-black uppercase tracking-tighter italic gap-2 border-glass-border bg-glass-fallback hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Zap className={`w-5 h-5 ${retentionMutation.isPending ? 'animate-pulse' : ''}`} />
            Force Retention
          </Button>
          <Button 
            onClick={() => trendingMutation.mutate()}
            disabled={trendingMutation.isPending}
            className="h-14 px-8 rounded-2xl font-black uppercase tracking-tighter italic gap-2 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <RefreshCcw className={`w-5 h-5 ${trendingMutation.isPending ? 'animate-spin' : ''}`} />
            Force Re-Sync
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rules Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Active Protocols</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className={`bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2rem] p-6 transition-all duration-500 hover:shadow-elevation-2 ${!rule.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-6">
                  <div className="flex gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${rule.is_active ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted/10 border-muted/20 text-muted-foreground'}`}>
                      {rule.trigger_type === 'SCHEDULED' ? <Clock className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black uppercase italic tracking-tighter">{rule.name}</h3>
                        {!rule.is_fully_automated && (
                          <Badge variant="outline" className="text-[8px] font-black border-blue-500/30 text-blue-500 bg-blue-500/5 px-1 uppercase italic">Adapter Required</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-bold tracking-tight">{rule.description}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                          <Cpu className="w-3 h-3" /> {rule.trigger_type}
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                          <Database className="w-3 h-3" /> {rule.action_type}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <Switch 
                      checked={!!rule.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                      disabled={toggleMutation.isPending}
                    />
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 ${rule.is_fully_automated ? 'border-green-500/20 text-green-500' : 'border-amber-500/20 text-amber-500'}`}>
                      {rule.is_fully_automated ? 'Autonomous' : 'Manual Review'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Logs Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Activity Log</h2>
            </div>
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest opacity-50">Live feed</Badge>
          </div>

          <Card className="bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2.5rem] p-6 h-[700px] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
                  <Construction className="w-12 h-12" />
                  <p className="text-xs font-black uppercase tracking-widest">No activity recorded yet</p>
                </div>
              ) : logs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 group hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : log.status === 'failed' ? <XCircle className="w-3 h-3 text-red-500" /> : <ShieldCheck className="w-3 h-3 text-blue-500" />}
                      <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">{(log.automation_rules as any)?.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground/60">{log.triggered_at ? format(new Date(log.triggered_at), 'HH:mm:ss') : '--:--:--'}</span>
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground line-clamp-2 leading-relaxed">{log.result}</p>
                  {log.status === 'queued_for_review' && (
                    <Button variant="ghost" className="h-6 w-full text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg">
                      Review Event
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer System Info */}
      <div className="flex items-center justify-between pt-8 border-t border-glass-border opacity-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Neural Engine: Operational
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest">
            Rules Managed: {rules.length}
          </div>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest">
          Build v2.9.5-AUTO
        </div>
      </div>
    </div>
  );
}

const Construction = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="2" y="6" width="20" height="8" rx="1" />
    <path d="M17 14v7" />
    <path d="M7 14v7" />
    <path d="M17 3v3" />
    <path d="M7 3v3" />
    <path d="M10 14 2.3 6.3" />
    <path d="m14 14 7.7-7.7" />
    <path d="m8 6 8 8" />
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
