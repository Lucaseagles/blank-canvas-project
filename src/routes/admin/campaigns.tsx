import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminCampaigns, saveCampaign, duplicateCampaign, terminateCampaign, setCampaignStatus, getCampaignFunnelData } from "@/lib/campaigns.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone, Plus, MoreVertical, Copy, Pause, Play, Calendar, LayoutDashboard, Settings as SettingsIcon, Package, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "@/lib/auth-guards.server";

const getCampaignProducts = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("products").select("id,title,current_price,status").in("status", ["active", "published"]).order("title").limit(500);
  if (error) throw error;
  return data ?? [];
});

export const Route = createFileRoute("/admin/campaigns")({ component: AdminCampaignsPage });

function AdminCampaignsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const { data: campaigns, isLoading, isError, refetch } = useQuery({ queryKey: ["adminCampaigns"], queryFn: () => getAdminCampaigns() });
  const { data: products = [], isLoading: isProductsLoading } = useQuery({ queryKey: ["campaignProducts"], queryFn: () => getCampaignProducts() });
  const { data: funnelData, isLoading: isFunnelLoading } = useQuery({ queryKey: ["campaignFunnel", selectedCampaignId], queryFn: () => getCampaignFunnelData({ data: { campaignId: selectedCampaignId! } }), enabled: !!selectedCampaignId });

  const saveMutation = useMutation({ mutationFn: saveCampaign, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCampaigns"] }); setIsCreateOpen(false); setEditingCampaign(null); setSelectedProductIds([]); toast.success("Campaign saved successfully"); }, onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save campaign") });
  const duplicateMutation = useMutation({ mutationFn: duplicateCampaign, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCampaigns"] }); toast.success("Campaign duplicated"); }, onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to duplicate campaign") });
  const terminateMutation = useMutation({ mutationFn: terminateCampaign, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCampaigns"] }); toast.success("Campaign terminated"); }, onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to terminate campaign") });
  const statusMutation = useMutation({ mutationFn: setCampaignStatus, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCampaigns"] }); toast.success("Campaign status updated"); }, onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update campaign status") });

  const openEditor = (campaign: any = null) => {
    setEditingCampaign(campaign);
    setSelectedProductIds(campaign?.campaign_products?.map((p: { product_id: string }) => p.product_id) ?? []);
    setIsCreateOpen(true);
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const channels: string[] = ["FEED_BANNER", "PUSH", "TELEGRAM", "REFERRAL_BOOST"].filter((channel) => Boolean(formData.get(channel)));
    const startsAt = formData.get("starts_at") as string;
    const endsAt = formData.get("ends_at") as string;
    if (new Date(endsAt) <= new Date(startsAt)) { toast.error("End date must be after start date"); return; }
    saveMutation.mutate({ data: { campaign: { id: editingCampaign?.id, name: formData.get("name") as string, description: formData.get("description") as string, starts_at: new Date(startsAt).toISOString(), ends_at: new Date(endsAt).toISOString(), status: (editingCampaign?.status || "scheduled") as "scheduled" | "active" | "paused" | "ended" }, channels: channels as ("FEED_BANNER" | "PUSH" | "TELEGRAM" | "REFERRAL_BOOST" | "SOCIAL_FOLLOW")[], productIds: selectedProductIds } });
  };

  const getStatusColor = (status: string) => status === "active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : status === "paused" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : status === "ended" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20";

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div><Badge variant="outline" className="mb-2 border-primary/20 text-primary uppercase font-black tracking-widest text-[10px]">Campaign Engine V1</Badge><h1 className="text-4xl font-black tracking-tighter uppercase italic">Traffic <span className="text-primary">Funnels</span></h1></div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) { setEditingCampaign(null); setSelectedProductIds([]); } }}>
          <DialogTrigger asChild><Button onClick={() => openEditor()} className="w-full sm:w-auto rounded-xl font-black uppercase italic gap-2 h-12 px-6"><Plus size={18} /> New Campaign</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[650px] rounded-[2rem] border-glass-border bg-glass backdrop-blur-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic">{editingCampaign ? "Edit" : "Create"} Campaign</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2"><Label className="uppercase font-black text-[10px] tracking-widest opacity-60">Campaign Name</Label><Input name="name" defaultValue={editingCampaign?.name} required minLength={3} placeholder="Summer Launch 2026" className="rounded-xl border-glass-border bg-glass/50" /></div>
                <div className="space-y-2 col-span-2"><Label className="uppercase font-black text-[10px] tracking-widest opacity-60">Description</Label><Input name="description" defaultValue={editingCampaign?.description ?? ""} placeholder="Campaign objective" className="rounded-xl border-glass-border bg-glass/50" /></div>
                <div className="space-y-2"><Label className="uppercase font-black text-[10px] tracking-widest opacity-60">Start Date</Label><Input name="starts_at" type="datetime-local" defaultValue={editingCampaign?.starts_at?.slice(0, 16)} required className="rounded-xl border-glass-border bg-glass/50" /></div>
                <div className="space-y-2"><Label className="uppercase font-black text-[10px] tracking-widest opacity-60">End Date</Label><Input name="ends_at" type="datetime-local" defaultValue={editingCampaign?.ends_at?.slice(0, 16)} required className="rounded-xl border-glass-border bg-glass/50" /></div>
              </div>
              <div className="space-y-3"><Label className="uppercase font-black text-[10px] tracking-widest opacity-60">Active Channels</Label><div className="grid grid-cols-2 gap-3">{["FEED_BANNER", "PUSH", "TELEGRAM", "REFERRAL_BOOST"].map((channel) => <div key={channel} className="flex items-center space-x-3 p-3 rounded-xl border border-glass-border bg-glass/30"><Checkbox id={channel} name={channel} defaultChecked={editingCampaign?.campaign_channels?.some((c: any) => c.channel === channel)} /><label htmlFor={channel} className="text-xs font-bold uppercase tracking-tight cursor-pointer">{channel.replace("_", " ")}</label></div>)}</div></div>
              <div className="space-y-3"><div className="flex items-center justify-between"><Label className="uppercase font-black text-[10px] tracking-widest opacity-60">Campaign Products</Label><Badge variant="secondary">{selectedProductIds.length} selected</Badge></div><div className="rounded-xl border border-glass-border bg-glass/30 max-h-56 overflow-y-auto p-2">{isProductsLoading ? <div className="p-6 text-center text-xs opacity-50">Loading products...</div> : products.length === 0 ? <div className="p-6 text-center text-xs opacity-50">No active products available</div> : products.map((product: { id: string; title: string; current_price: number | null }) => <label key={product.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 cursor-pointer"><Checkbox checked={selectedProductIds.includes(product.id)} onCheckedChange={(checked) => setSelectedProductIds((current) => checked ? [...new Set([...current, product.id])] : current.filter((id) => id !== product.id))} /><span className="text-sm font-bold flex-1">{product.title}</span>{product.current_price != null && <span className="text-xs opacity-60">R$ {Number(product.current_price).toFixed(2)}</span>}</label>)}</div></div>
              <DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-black uppercase italic" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Execute Deployment"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-[2rem] border-glass-border bg-glass/50 backdrop-blur-md overflow-hidden"><CardHeader className="border-b border-glass-border pb-6"><div className="flex items-center justify-between"><div><CardTitle className="text-xl font-black uppercase italic">Neural Operations</CardTitle><CardDescription className="text-xs font-bold uppercase tracking-tighter">Active and Scheduled Campaigns</CardDescription></div><LayoutDashboard className="w-5 h-5 text-primary opacity-50" /></div></CardHeader><CardContent className="p-0">{isLoading ? <div className="p-12 text-center text-xs font-bold uppercase tracking-widest opacity-40">Loading campaigns...</div> : isError ? <div className="p-12 text-center space-y-4"><p className="text-sm text-rose-400">Unable to load campaigns.</p><Button variant="outline" onClick={() => refetch()}>Retry</Button></div> : <div className="divide-y divide-glass-border">{campaigns?.map((campaign: any) => <div key={campaign.id} className={`p-6 hover:bg-primary/5 transition-colors cursor-pointer group ${selectedCampaignId === campaign.id ? "bg-primary/10" : ""}`} onClick={() => setSelectedCampaignId(campaign.id)}><div className="flex items-start justify-between gap-4"><div className="space-y-1 min-w-0"><div className="flex flex-wrap items-center gap-3"><h3 className="font-black uppercase italic text-lg truncate">{campaign.name}</h3><Badge className={`rounded-full px-3 text-[9px] uppercase font-black ${getStatusColor(campaign.status)}`}>{campaign.status}</Badge></div><p className="text-xs text-muted-foreground font-medium">{campaign.description}</p><div className="flex flex-wrap items-center gap-4 mt-3"><div className="flex items-center gap-1.5 text-[10px] font-bold opacity-60"><Calendar size={12} />{new Date(campaign.starts_at).toLocaleDateString()} - {new Date(campaign.ends_at).toLocaleDateString()}</div><div className="flex gap-1 flex-wrap">{campaign.campaign_channels?.map((c: any) => <Badge key={c.id} variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-1.5">{c.channel.split("_")[0]}</Badge>)}</div></div></div><DropdownMenu><DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="rounded-lg" aria-label={`Actions for ${campaign.name}`}><MoreVertical size={16} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="rounded-xl border-glass-border bg-glass backdrop-blur-xl"><DropdownMenuItem onClick={() => openEditor(campaign)} className="font-bold uppercase text-[10px] tracking-widest gap-2"><SettingsIcon size={14} /> Edit</DropdownMenuItem><DropdownMenuItem onClick={() => duplicateMutation.mutate({ data: { id: campaign.id } })} disabled={duplicateMutation.isPending} className="font-bold uppercase text-[10px] tracking-widest gap-2"><Copy size={14} /> {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}</DropdownMenuItem>{campaign.status === "active" ? <DropdownMenuItem onClick={() => statusMutation.mutate({ data: { id: campaign.id, status: "paused" } })} disabled={statusMutation.isPending} className="font-bold uppercase text-[10px] tracking-widest gap-2"><Pause size={14} /> Pause</DropdownMenuItem> : campaign.status === "paused" || campaign.status === "scheduled" ? <DropdownMenuItem onClick={() => statusMutation.mutate({ data: { id: campaign.id, status: "active" } })} disabled={statusMutation.isPending} className="font-bold uppercase text-[10px] tracking-widest gap-2"><Play size={14} /> Activate</DropdownMenuItem> : null}<DropdownMenuItem onClick={() => { if (window.confirm(`Terminate campaign "${campaign.name}"?`)) terminateMutation.mutate({ data: { id: campaign.id } }); }} disabled={campaign.status === "ended" || terminateMutation.isPending} className="font-bold uppercase text-[10px] tracking-widest gap-2 text-rose-500"><Pause size={14} /> {campaign.status === "ended" ? "Ended" : "Terminate"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>)}{(!campaigns || campaigns.length === 0) && <div className="p-12 text-center space-y-4"><Megaphone className="w-12 h-12 mx-auto text-muted-foreground opacity-20" /><p className="text-xs font-bold uppercase tracking-widest opacity-40">No campaigns detected</p></div>}</div>}</CardContent></Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2"><Card className="rounded-[2rem] border-glass-border bg-glass/50 backdrop-blur-md overflow-hidden h-full"><CardHeader className="border-b border-glass-border pb-6"><CardTitle className="text-xl font-black uppercase italic">Funnel Analytics</CardTitle><CardDescription className="text-xs font-bold uppercase tracking-tighter">{selectedCampaignId ? "Real traffic flow" : "Select a campaign to view funnel"}</CardDescription></CardHeader><CardContent className="p-6">{selectedCampaignId && isFunnelLoading ? <div className="py-20 text-center text-xs font-bold uppercase tracking-widest opacity-40">Loading telemetry...</div> : selectedCampaignId && funnelData ? <div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={funnelData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="channel" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="awareness_count" name="Awareness" fill="#3b82f6"><Cell /></Bar><Bar dataKey="consideration_count" name="Consideration" fill="#10b981"><Cell /></Bar><Bar dataKey="video_views" name="Video views" fill="#f59e0b"><Cell /></Bar><Bar dataKey="conversion_count" name="Outbound clicks" fill="#8b5cf6"><Cell /></Bar></BarChart></ResponsiveContainer></div> : <div className="py-20 text-center text-xs font-bold uppercase tracking-widest opacity-40">No campaign selected</div>}</CardContent></Card></div><Card className="rounded-[2rem] border-glass-border bg-glass/50 backdrop-blur-md"><CardHeader><CardTitle className="text-lg font-black uppercase italic">Campaign Integrity</CardTitle><CardDescription>Real configuration state</CardDescription></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex justify-between"><span>Campaigns</span><span className="font-black">{campaigns?.length ?? 0}</span></div><div className="flex justify-between"><span>Active products</span><span className="font-black">{products.length}</span></div><div className="flex justify-between"><span>Selected</span><span className="font-black">{selectedCampaignId ? campaigns?.find((c: any) => c.id === selectedCampaignId)?.campaign_products?.length ?? 0 : 0}</span></div><Button variant="outline" className="w-full" onClick={() => { void refetch(); void queryClient.invalidateQueries({ queryKey: ["campaignProducts"] }); }}><RefreshCw size={14} className="mr-2" /> Refresh</Button></CardContent></Card></div>
    </div>
  );
}
