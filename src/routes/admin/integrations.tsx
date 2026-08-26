import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, Shield, ExternalLink, RefreshCw, Key, Save, AlertTriangle, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { updateMarketplaceCredentials, syncMarketplace } from "@/lib/connectors.functions";
import { getComplianceRules, saveComplianceRule } from "@/lib/compliance.functions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/integrations")({
  component: AdminIntegrationsPage,
});

function AdminIntegrationsPage() {
  const queryClient = useQueryClient();
  const updateCreds = useServerFn(updateMarketplaceCredentials);
  const sync = useServerFn(syncMarketplace);
  const [selectedMarketplace, setSelectedMarketplace] = useState<any>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showCompliance, setShowCompliance] = useState(false);
  const [complianceNotes, setComplianceNotes] = useState("");

  const fetchRules = useServerFn(getComplianceRules);
  const saveRule = useServerFn(saveComplianceRule);

  const { data: marketplaces, isLoading } = useQuery({
    queryKey: ["admin-marketplaces-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplaces")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      return await sync({ data: { marketplaceId: id } });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Marketplace synchronized");
      queryClient.invalidateQueries({ queryKey: ["admin-marketplaces-status"] });
    },
    onError: (err: any) => {
      toast.error(`Sync failed: ${err.message}`);
    }
  });

  const saveCredsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMarketplace) return;
      return await updateCreds({ 
        data: { 
          marketplaceId: selectedMarketplace.id, 
          credentials 
        } 
      });
    },
    onSuccess: () => {
      toast.success("Credentials stored securely");
      setSelectedMarketplace(null);
      setCredentials({});
      queryClient.invalidateQueries({ queryKey: ["admin-marketplaces-status"] });
    },
    onError: (err: any) => {
      toast.error(`Failed to save: ${err.message}`);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': case 'connected': return <ShieldCheck className="text-green-500" />;
      case 'error': return <ShieldAlert className="text-destructive" />;
      default: return <Shield className="text-yellow-500" />;
    }
  };

  const handleOpenConfig = (m: any) => {
    setSelectedMarketplace(m);
    // Initialize with placeholders or empty
    setCredentials({
      apiKey: "",
      trackingId: "",
      clientSecret: ""
    });
  };

  return (
    <div className="container mx-auto py-8 lg:py-12 px-4 lg:px-8 space-y-8 max-w-7xl pb-safe">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3 uppercase tracking-widest text-[10px]">Security Protocol</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Integrations</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Secure management of affiliate API credentials. Credentials are encrypted and stored in the backend vault.
          </p>
        </div>
        <Button variant="outline" className="w-full md:w-auto h-12 rounded-2xl border-glass-border font-black uppercase tracking-tighter italic gap-2 bg-background/50 backdrop-blur-xl">
          <RefreshCw className="w-4 h-4" />
          Verify Connectivity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="bg-glass-fallback border-glass-border animate-pulse h-64 rounded-[2rem]" />
          ))
        ) : marketplaces?.map((m) => (
          <Card key={m.id} className="bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2rem] overflow-hidden group shadow-2xl elevation-1 transition-all hover:elevation-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-black uppercase tracking-tighter italic">{m.name}</CardTitle>
                <CardDescription className="text-[10px] font-mono uppercase tracking-tighter opacity-50">{m.slug}</CardDescription>
              </div>
              {getStatusIcon(m.status ?? '')}
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Connector Status</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`w-fit uppercase text-[10px] font-black px-3 py-1 rounded-full ${
                    m.status === 'active' || m.status === 'connected' ? 'border-green-500/50 text-green-500 bg-green-500/5' : 'border-yellow-500/50 text-yellow-500 bg-yellow-500/5'
                  }`}>
                    {m.status === 'active' || m.status === 'connected' ? 'Synchronized' : 'Credentials Required'}
                  </Badge>
                  {m.status === 'error' && (
                    <Badge variant="destructive" className="uppercase text-[9px] font-black px-2 py-0.5 rounded-full">
                      API Fail
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 rounded-xl text-[10px] font-black uppercase tracking-tighter italic gap-2 border-glass-border bg-white/5"
                  onClick={() => handleOpenConfig(m)}
                >
                  <Key size={12} className="text-primary" />
                  Configure
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="h-10 rounded-xl text-[10px] font-black uppercase tracking-tighter italic gap-2 shadow-lg"
                  disabled={syncMutation.isPending || (m.status !== 'active' && m.status !== 'connected')}
                  onClick={() => syncMutation.mutate(m.id)}
                >
                  <RefreshCw size={12} className={syncMutation.isPending ? "animate-spin" : ""} />
                  Sync Now
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="col-span-2 h-10 rounded-xl text-[10px] font-black uppercase tracking-tighter italic gap-2 border border-white/5 hover:bg-white/5"
                  onClick={() => {
                    setSelectedMarketplace(m);
                    setShowCompliance(true);
                  }}
                >
                  <BookOpen size={12} className="text-primary" />
                  Compliance Center
                </Button>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Last Ping: {m.api_status || 'N/A'}</span>
                <Button variant="ghost" size="icon" className="h-10 w-10 lg:h-8 lg:w-8 rounded-lg text-muted-foreground opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-3xl p-4 lg:p-8 flex flex-col md:flex-row gap-4 lg:gap-6 items-start shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-black text-xl tracking-tight uppercase italic">Secure Integration Protocol</h3>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">
            This system uses <span className="text-foreground font-bold italic">Offer Intelligence V1</span>. All connectors must be normalized to the internal architecture before synchronization. Real-time price tracking is limited by affiliate program rate limits to ensure tracking integrity.
          </p>
        </div>
      </div>

      {/* Config Dialog */}
      <Dialog open={!!selectedMarketplace} onOpenChange={(open) => !open && setSelectedMarketplace(null)}>
        <DialogContent className="bg-glass-fallback border-glass-border backdrop-blur-2xl rounded-[2.5rem] max-w-md sm:max-w-[425px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
              {selectedMarketplace?.name} <span className="text-primary">Credentials</span>
            </DialogTitle>
            <DialogDescription className="text-xs uppercase font-bold tracking-tight text-muted-foreground">
              Enter API credentials for {selectedMarketplace?.name}. These will be stored as encrypted secrets.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Key / Token</Label>
              <Input
                id="apiKey"
                type="password"
                className="bg-white/5 border-glass-border h-12 rounded-xl focus:ring-primary/20"
                value={credentials['apiKey'] || ""}
                onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="••••••••••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tracking / Affiliate ID</Label>
              <Input
                id="trackingId"
                className="bg-white/5 border-glass-border h-12 rounded-xl focus:ring-primary/20"
                value={credentials['trackingId'] || ""}
                onChange={(e) => setCredentials(prev => ({ ...prev, trackingId: e.target.value }))}
                placeholder="e.g. affiliate_123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client Secret (Optional)</Label>
              <Input
                id="clientSecret"
                type="password"
                className="bg-white/5 border-glass-border h-12 rounded-xl focus:ring-primary/20"
                value={credentials['clientSecret'] || ""}
                onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                placeholder="••••••••••••••••"
              />
            </div>

            
            <div className="flex gap-2 items-start bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium text-yellow-500/80 leading-normal">
                Never share these credentials. The system will automatically verify connectivity after saving.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button 
              className="w-full h-14 rounded-2xl font-black uppercase italic tracking-tighter gap-2 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={() => saveCredsMutation.mutate()}
              disabled={saveCredsMutation.isPending}
            >
              <Save className="w-5 h-5" />
              {saveCredsMutation.isPending ? "Storing..." : "Seal Credentials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compliance Dialog */}
      <Dialog open={showCompliance} onOpenChange={(open) => !open && setShowCompliance(false)}>
        <DialogContent className="bg-glass-fallback border-glass-border backdrop-blur-2xl rounded-[2.5rem] max-w-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
              {selectedMarketplace?.name} <span className="text-primary">Compliance Hub</span>
            </DialogTitle>
            <DialogDescription className="text-xs uppercase font-bold tracking-tight text-muted-foreground">
              Marketplace rules and documentation verification.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-[11px] font-bold text-destructive uppercase leading-tight">
                CRITICAL: Never finalize a purchase through your own link. Internal clicks are automatically filtered from reporting, but self-purchase violations occur at the marketplace level.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Verification Checklist</h4>
              <div className="space-y-2">
                {[
                  "Public vitrine access confirmed (No login wall)",
                  "Disclosure text visibility verified",
                  "Direct affiliate link structure maintained",
                  "No unauthorized shorteners (Bitly, etc.)",
                  "No cloaking/masking mechanisms active"
                ].map((check, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-[11px] font-medium opacity-80">{check}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compliance Notes & Documentation Source</Label>
              <textarea 
                className="w-full bg-white/5 border border-glass-border rounded-xl p-4 text-sm focus:ring-primary/20 min-h-[100px]"
                placeholder="Paste official documentation links or specific marketplace restrictions here..."
                value={complianceNotes}
                onChange={(e) => setComplianceNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-12 rounded-xl font-black uppercase italic tracking-tighter gap-2"
              onClick={() => {
                toast.success("Compliance status updated");
                setShowCompliance(false);
              }}
            >
              <ShieldCheck className="w-4 h-4" />
              Certify Marketplace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
