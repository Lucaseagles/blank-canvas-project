import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, Link2, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Clock, Edit3, Save, Globe } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";


export const Route = createFileRoute("/admin/marketplaces")({
  component: AdminMarketplacesPage,
});

function AdminMarketplacesPage() {
  const queryClient = useQueryClient();
  const [editingMarketplace, setEditingMarketplace] = useState<any>(null);
  const [linkStructure, setLinkStructure] = useState("");


  const { data: marketplaces, isLoading } = useQuery({
    queryKey: ["admin-marketplaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplaces")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("marketplaces")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketplaces"] });
      toast.success("Marketplace status updated");
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const updateStructureMutation = useMutation({
    mutationFn: async ({ id, structure }: { id: string; structure: string }) => {
      const { error } = await supabase
        .from("marketplaces")
        .update({ affiliate_link_structure: structure } as any)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketplaces"] });
      toast.success("Affiliate structure updated");
      setEditingMarketplace(null);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Link2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      connected: 'bg-green-500/10 text-green-500 border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      error: 'bg-red-500/10 text-red-500 border-red-500/20',
      disabled: 'bg-muted/50 text-muted-foreground border-glass-border'
    };
    
    return (
      <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase ${variants[status as keyof typeof variants] || variants['disabled']}`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Connectors</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">MARKETPLACES</h1>
        </div>
        
        <Button variant="outline" className="h-11 px-6 font-bold gap-2 rounded-xl bg-background/50 border-glass-border">
          <RefreshCw className="w-4 h-4" />
          Re-sync All
        </Button>
      </div>

      <div className="bg-glass-fallback border border-glass-border rounded-3xl overflow-hidden shadow-2xl elevation-1 reveal-on-scroll">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-glass-border">
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground py-6 pl-8">Marketplace</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">ID / Slug</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Connector Status</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">API Integrity</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground">Link Logic</TableHead>

              <TableHead className="font-black text-xs uppercase tracking-widest text-muted-foreground text-right pr-8">Control</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i} className="border-glass-border">
                  <TableCell className="pl-8 py-6"><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-6 w-24 bg-muted animate-pulse rounded-full" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell className="text-right pr-8"><div className="h-8 w-24 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                </TableRow>
              ))
            ) : marketplaces?.map((m) => (
              <TableRow key={m.id} className="hover:bg-white/5 border-glass-border transition-colors group">
                <TableCell className="font-bold py-6 pl-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Database className="w-4 h-4" />
                    </div>
                    {m.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[10px] text-muted-foreground tracking-tighter">
                  {m.slug}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(m.status)}
                    {getStatusBadge(m.status)}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-xs">
                  {m.api_status || 'Pending Verification'}
                </TableCell>
                <TableCell className="font-mono text-[9px] text-muted-foreground max-w-[150px] truncate">
                  {(m as any).affiliate_link_structure || 'Standard'}
                </TableCell>


                <TableCell className="text-right pr-8">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs font-bold font-mono h-8"
                      onClick={() => updateStatusMutation.mutate({ 
                        id: m.id, 
                        status: m.status === 'disabled' ? 'pending' : 'disabled' 
                      })}
                    >
                      {m.status === 'disabled' ? 'ENABLE' : 'DISABLE'}
                    </Button>
                    <Dialog open={editingMarketplace?.id === m.id} onOpenChange={(open) => {
                      if (!open) setEditingMarketplace(null);
                      else {
                        setEditingMarketplace(m);
                        setLinkStructure((m as any).affiliate_link_structure || "");
                      }

                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-glass backdrop-blur-3xl border-glass-border rounded-[2rem]">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                            <Globe className="text-primary" />
                            Link Logic: {m.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Affiliate Link Structure</Label>
                            <Input 
                              value={linkStructure}
                              onChange={(e) => setLinkStructure(e.target.value)}
                              placeholder="e.g. https://amazon.com.br/dp/{id}?tag=my-tag-20"
                              className="h-14 bg-white/5 border-glass-border font-mono text-xs tracking-tighter rounded-2xl"
                            />
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                              Use <code className="text-primary">{'{id}'}</code> as placeholder for the product unique identifier.
                            </p>
                          </div>
                          <Button 
                            className="w-full h-14 rounded-2xl font-black uppercase italic tracking-tighter gap-2"
                            onClick={() => updateStructureMutation.mutate({ id: m.id, structure: linkStructure })}
                            disabled={updateStructureMutation.isPending}
                          >
                            <Save className="w-4 h-4" />
                            {updateStructureMutation.isPending ? 'SAVING...' : 'SAVE STRUCTURE'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">

                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-glass-fallback border border-yellow-500/20 rounded-2xl p-6 flex gap-4 items-start reveal-on-scroll">
        <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-yellow-500 text-sm tracking-tight uppercase">SPRINT 1 LIMITATION</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Real-time API synchronization is not implemented in this phase. Connectors are established as <span className="text-foreground font-medium">pending</span> until Part 3 or Sprint 2 verification.
          </p>
        </div>
      </div>
    </div>
  );
}
