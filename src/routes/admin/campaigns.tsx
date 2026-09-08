import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminCampaigns,
  saveCampaign,
  duplicateCampaign,
  terminateCampaign,
  getCampaignFunnelData,
} from "@/lib/campaigns.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Megaphone,
  Plus,
  MoreVertical,
  Copy,
  Pause,
  BarChart3,
  Calendar,
  Target,
  LayoutDashboard,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export const Route = createFileRoute("/admin/campaigns")({
  component: AdminCampaignsPage,
});

function AdminCampaignsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { data: campaigns, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminCampaigns"],
    queryFn: () => getAdminCampaigns(),
  });

  const { data: funnelData, isLoading: isFunnelLoading } = useQuery({
    queryKey: ["campaignFunnel", selectedCampaignId],
    queryFn: () => getCampaignFunnelData({ data: { campaignId: selectedCampaignId! } }),
    enabled: !!selectedCampaignId,
  });

  const saveMutation = useMutation({
    mutationFn: saveCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCampaigns"] });
      setIsCreateOpen(false);
      setEditingCampaign(null);
      toast.success("Campaign saved successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save campaign");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCampaigns"] });
      toast.success("Campaign duplicated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate campaign");
    },
  });

  const terminateMutation = useMutation({
    mutationFn: terminateCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCampaigns"] });
      toast.success("Campaign terminated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to terminate campaign");
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const channels: string[] = [];
    if (formData.get("FEED_BANNER")) channels.push("FEED_BANNER");
    if (formData.get("PUSH")) channels.push("PUSH");
    if (formData.get("TELEGRAM")) channels.push("TELEGRAM");
    if (formData.get("REFERRAL_BOOST")) channels.push("REFERRAL_BOOST");

    const startsAt = formData.get("starts_at") as string;
    const endsAt = formData.get("ends_at") as string;
    if (new Date(endsAt) <= new Date(startsAt)) {
      toast.error("End date must be after start date");
      return;
    }

    saveMutation.mutate({
      data: {
        campaign: {
          id: editingCampaign?.id,
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          starts_at: startsAt,
          ends_at: endsAt,
          status: (editingCampaign?.status || "scheduled") as "scheduled" | "active" | "paused" | "ended",
        },
        channels: channels as ("FEED_BANNER" | "PUSH" | "TELEGRAM" | "REFERRAL_BOOST" | "SOCIAL_FOLLOW")[],
        productIds: editingCampaign?.campaign_products?.map((p: any) => p.product_id) ?? [],
      },
    });
  };

  const handleTerminate = (campaign: any) => {
    if (campaign.status === "ended") return;
    const confirmed = window.confirm(`Terminate campaign "${campaign.name}"? This will mark it as ended immediately.`);
    if (!confirmed) return;
    terminateMutation.mutate({ data: { id: campaign.id } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "paused": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "ended": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/20 text-primary uppercase font-black tracking-widest text-[10px]">
            Campaign Engine V1
          </Badge>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Traffic <span className="text-primary">Funnels</span>
          </h1>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setEditingCampaign(null);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto rounded-xl font-black uppercase italic gap-2 h-12 px-6">
              <Plus size={18} /> New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-glass-border bg-glass backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic">
                {editingCampaign ? "Edit" : "Create"} Campaign
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="uppercase font-black text-[10px] tracking-widest opacity-60">Campaign Name</Label>
                  <Input name="name" defaultValue={editingCampaign?.name} required minLength={3} placeholder="Summer Launch 2026" className="rounded-xl border-glass-border bg-glass/50" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="uppercase font-black text-[10px] tracking-widest opacity-60">Description</Label>
                  <Input name="description" defaultValue={editingCampaign?.description} placeholder="Focus on premium tech categories" className="rounded-xl border-glass-border bg-glass/50" />
                </div>
                <div className="space-y-2">
                  <Label className="uppercase font-black text-[10px] tracking-widest opacity-60">Start Date</Label>
                  <Input name="starts_at" type="datetime-local" defaultValue={editingCampaign?.starts_at?.slice(0, 16)} required className="rounded-xl border-glass-border bg-glass/50" />
                </div>
                <div className="space-y-2">
                  <Label className="uppercase font-black text-[10px] tracking-widest opacity-60">End Date</Label>
                  <Input name="ends_at" type="datetime-local" defaultValue={editingCampaign?.ends_at?.slice(0, 16)} required className="rounded-xl border-glass-border bg-glass/50" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="uppercase font-black text-[10px] tracking-widest opacity-60">Active Channels</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["FEED_BANNER", "PUSH", "TELEGRAM", "REFERRAL_BOOST"].map((channel) => (
                    <div key={channel} className="flex items-center space-x-3 p-3 rounded-xl border border-glass-border bg-glass/30">
                      <Checkbox id={channel} name={channel} defaultChecked={editingCampaign?.campaign_channels?.some((c: any) => c.channel === channel)} />
                      <label htmlFor={channel} className="text-xs font-bold uppercase tracking-tight cursor-pointer">
                        {channel.replace("_", " ")}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase italic" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Execute Deployment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-[2rem] border-glass-border bg-glass/50 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-glass-border pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black uppercase italic">Neural Operations</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-tighter">Active and Scheduled Campaigns</CardDescription>
            </div>
            <LayoutDashboard className="w-5 h-5 text-primary opacity-50" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-bold uppercase tracking-widest opacity-40">Loading campaigns...</div>
          ) : isError ? (
            <div className="p-12 text-center space-y-4">
              <p className="text-sm text-rose-400">Unable to load campaigns.</p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : (
            <div className="divide-y divide-glass-border">
              {campaigns?.map((campaign: any) => (
                <div
                  key={campaign.id}
                  className={`p-6 hover:bg-primary/5 transition-colors cursor-pointer group ${selectedCampaignId === campaign.id ? "bg-primary/10" : ""}`}
                  onClick={() => setSelectedCampaignId(campaign.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-black uppercase italic text-lg truncate">{campaign.name}</h3>
                        <Badge className={`rounded-full px-3 text-[9px] uppercase font-black ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">{campaign.description}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-60">
                          <Calendar size={12} />
                          {new Date(campaign.starts_at).toLocaleDateString()} - {new Date(campaign.ends_at).toLocaleDateString()}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {campaign.campaign_channels?.map((c: any) => (
                            <Badge key={c.id} variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-1.5">
                              {c.channel.split("_")[0]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="rounded-lg" aria-label={`Actions for ${campaign.name}`}>
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-glass-border bg-glass backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => {
                          setEditingCampaign(campaign);
                          setIsCreateOpen(true);
                        }} className="font-bold uppercase text-[10px] tracking-widest gap-2">
                          <SettingsIcon size={14} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate({ data: { id: campaign.id } })} disabled={duplicateMutation.isPending} className="font-bold uppercase text-[10px] tracking-widest gap-2">
                          <Copy size={14} /> {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleTerminate(campaign)}
                          disabled={campaign.status === "ended" || terminateMutation.isPending}
                          className="font-bold uppercase text-[10px] tracking-widest gap-2 text-rose-500 focus:text-rose-500"
                        >
                          <Pause size={14} /> {campaign.status === "ended" ? "Ended" : terminateMutation.isPending ? "Terminating..." : "Terminate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {(!campaigns || campaigns.length === 0) && (
                <div className="p-12 text-center space-y-4">
                  <Megaphone className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40">No campaigns detected</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="rounded-[2rem] border-glass-border bg-glass/50 backdrop-blur-md overflow-hidden h-full">
            <CardHeader className="border-b border-glass-border pb-6">
              <CardTitle className="text-xl font-black uppercase italic">Funnel Analytics</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-tighter">
                {selectedCampaignId ? "Real-time Traffic Flow" : "Select a campaign to view funnel"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {selectedCampaignId && isFunnelLoading ? (
                <div className="py-20 text-center text-xs font-bold uppercase tracking-widest opacity-40">Loading telemetry...</div>
              ) : selectedCampaignId && funnelData ? (
                <div className="space-y-8">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={funnelData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="channel" type="category" stroke="rgba(255,255,255,0.5)" fontSize={10} fontWeight="bold" />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                        <Bar dataKey="awareness_count" name="Awareness" radius={[0, 4, 4, 0]}>
                          {funnelData.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Bar>
                        <Bar dataKey="consideration_count" name="Consideration" fill="#10b981" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="video_views" name="Video Impact" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="conversion_count" name="Conversion" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {funnelData.map((item: any) => {
                      const conversionRate = item.awareness_count > 0 ? ((item.conversion_count / item.awareness_count) * 100).toFixed(1) : "0";
                      return (
                        <div key={item.channel} className="p-4 rounded-2xl border border-glass-border bg-glass/30 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{item.channel}</p>
                            {item.video_views > 0 && <span className="text-[8px] font-bold text-violet-400 uppercase tracking-tighter">{item.video_views} Plays</span>}
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xl font-black italic">{conversionRate}%</span>
                            <Badge variant="outline" className="text-[8px] font-bold border-emerald-500/20 text-emerald-500">CONV</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button className="w-full h-12 rounded-xl font-black uppercase italic gap-2 bg-emerald-500 hover:bg-emerald-600">
                    <Target size={16} /> Optimize ROI
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-20">
                  <BarChart3 className="w-16 h-16" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Telemetry Offline</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[2rem] border-glass-border bg-glass/50 backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-glass-border pb-6">
            <CardTitle className="text-xl font-black uppercase italic">Campaign Safety</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-tighter">Administrative safeguards</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg tracking-tight uppercase italic">Compliance Safeguard Active</h3>
              <p className="text-muted-foreground text-[11px] leading-relaxed uppercase font-bold tracking-tight">
                Owner-only campaign mutations are enforced server-side. Termination changes the real campaign status to ended immediately and refreshes the admin list.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
