import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  getTelegramConfig, 
  saveTelegramConfig, 
  composeTelegramMessage, 
  sendTelegramManual 
} from "@/lib/telegram.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Send, 
  Settings, 
  MessageSquare, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Bot
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/telegram")({
  component: TelegramAdmin,
});

function TelegramAdmin() {
  const queryClient = useQueryClient();
  const getCfg = useServerFn(getTelegramConfig);
  const saveCfg = useServerFn(saveTelegramConfig);
  const composeMsg = useServerFn(composeTelegramMessage);
  const sendMsg = useServerFn(sendTelegramManual);

  const [botToken, setBotToken] = useState("");
  const [manualProductId, setManualProductId] = useState("");
  const [manualMessage, setManualMessage] = useState("");

  const { data: config, isLoading } = useQuery({
    queryKey: ["telegram-config"],
    queryFn: () => getCfg({ data: {} as any }),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { channelId: string; isActive: boolean; botToken?: string | null }) => 
      saveCfg({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-config"] });
      toast.success("Telegram configuration saved");
      setBotToken("");
    }
  });

  const composeMutation = useMutation({
    mutationFn: (productId: string) => composeMsg({ data: { productId } }),
    onSuccess: (res: any) => {
      if (res.message) {
        setManualMessage(res.message);
        toast.success("Message composed successfully");
      } else {
        toast.error(res.error || "Failed to compose");
      }
    }
  });

  const sendMutation = useMutation({
    mutationFn: (data: { productId: string; message: string }) => sendMsg({ data }),
    onSuccess: () => {
      toast.success("Message sent to queue");
      setManualMessage("");
      setManualProductId("");
    }
  });

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveMutation.mutate({
      channelId: formData.get("channelId") as string,
      isActive: formData.get("isActive") === "on",
      botToken: botToken || null
    });
  };

  return (
    <div className="container mx-auto py-12 px-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge className="bg-sky-500/10 text-sky-500 border-sky-500/20 font-bold px-3 uppercase tracking-tighter">Signal Distribution</Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none flex items-center gap-4">
            Telegram Core
            <Bot className="w-12 h-12 text-sky-500" />
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Card */}
        <Card className="lg:col-span-1 bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
              <Settings className="w-5 h-5 text-sky-500" />
              Neural Setup
            </CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Bot & Channel parameters</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Channel ID / Username</Label>
                <Input 
                  name="channelId"
                  defaultValue={config?.channel_id || ""}
                  placeholder="@your_channel"
                  className="bg-background/50 border-glass-border rounded-xl font-bold"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Bot Token (BotFather)</Label>
                <Input 
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder={config?.hasToken ? "••••••••••••••••" : "Paste new token"}
                  className="bg-background/50 border-glass-border rounded-xl font-bold"
                />
                {config?.hasToken && (
                  <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Token active in vault
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-sky-500">Service Status</Label>
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">Enable global broadcasting</p>
                </div>
                <Switch 
                  name="isActive" 
                  defaultChecked={config?.is_active}
                />
              </div>

              <Button 
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black uppercase italic tracking-widest rounded-xl py-6"
              >
                {saveMutation.isPending ? "Syncing..." : "Update Engine"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Manual Broadcast Card */}
        <Card className="lg:col-span-2 bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-500" />
              Manual Pulse
            </CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Compose & dispatch unique signals</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Product ID (Internal)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={manualProductId}
                    onChange={(e) => setManualProductId(e.target.value)}
                    placeholder="UUID or Slug"
                    className="bg-background/50 border-glass-border rounded-xl font-bold"
                  />
                  <Button 
                    onClick={() => composeMutation.mutate(manualProductId)}
                    disabled={!manualProductId || composeMutation.isPending}
                    variant="outline"
                    className="border-glass-border font-black uppercase italic text-[10px] tracking-widest rounded-xl"
                  >
                    <Zap className="w-3 h-3 mr-2" />
                    Compose
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Signal Payload (Markdown Support)</Label>
              <Textarea 
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                rows={8}
                placeholder="Compose your message here..."
                className="bg-background/50 border-glass-border rounded-2xl font-mono text-sm resize-none p-6"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                onClick={() => setManualMessage("")}
                variant="ghost"
                className="font-black uppercase italic text-[10px] tracking-widest rounded-xl"
              >
                Clear
              </Button>
              <Button 
                onClick={() => sendMutation.mutate({ productId: manualProductId, message: manualMessage })}
                disabled={!manualMessage || !manualProductId || sendMutation.isPending}
                className="bg-sky-500 hover:bg-sky-600 text-white font-black uppercase italic tracking-widest rounded-xl px-10 py-6"
              >
                <Send className="w-4 h-4 mr-2" />
                Dispatch Signal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logic Preview / Activity Log */}
      <Card className="bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2.5rem] p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-500/10 rounded-2xl">
            <AlertCircle className="w-6 h-6 text-sky-500" />
          </div>
          <div className="space-y-4 w-full">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-sky-500 italic">Engine Protocols</h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Status of automated neural dispatchers</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Best Offer Pulse", status: "Active", desc: "Daily digest of top score products" },
                { label: "Price Drop Alert", status: "Active", desc: "Instant notification on >15% drops" },
                { label: "Viral Flash", status: "Pending", desc: "Broadcasting products with high CTR" }
              ].map((item) => (
                <div key={item.label} className="bg-background/50 border border-glass-border p-6 rounded-[2rem] space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{item.label}</p>
                    <Badge variant={item.status === 'Active' ? 'default' : 'outline'} className={item.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20 text-[8px]' : 'text-[8px]'}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
