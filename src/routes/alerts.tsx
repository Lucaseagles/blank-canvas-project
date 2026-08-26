import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPriceAlerts, getNotifications, deletePriceAlert, markNotificationRead } from "@/lib/engagement.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Bell, BellOff, TrendingDown, Trash2, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alertas de Preço — Vigilância Automática" },
      { name: "description", content: "Monitore preços dos seus produtos favoritos e receba avisos assim que o valor cair." },
      { property: "og:title", content: "Alertas de Preço — Vigilância Automática" },
      { property: "og:description", content: "Monitore preços dos seus produtos favoritos e receba avisos assim que o valor cair." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  
  const getAlertsFn = useServerFn(getPriceAlerts);
  const getNotifsFn = useServerFn(getNotifications);
  const deleteAlertFn = useServerFn(deletePriceAlert);
  const markReadFn = useServerFn(markNotificationRead);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ["price-alerts", userId],
    queryFn: () => getAlertsFn(),
    enabled: !!userId,
  });

  const { data: notifications, isLoading: loadingNotifs } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => getNotifsFn(),
    enabled: !!userId,
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (alertId: string) => deleteAlertFn({ data: { alertId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts", userId] });
      toast.success("Monitor de preço desativado.");
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markReadFn({ data: { notificationId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    }
  });

  if (!userId) {
    return (
      <div className="container mx-auto py-32 px-4 text-center space-y-8">
        <div className="w-24 h-24 rounded-[2rem] bg-muted/20 border border-glass-border flex items-center justify-center mx-auto">
          <BellOff className="w-10 h-10 text-muted-foreground opacity-20" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Sinal Negado</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Por favor, sincronize seu perfil de operador para acessar alertas de inteligência.</p>
        </div>
        <Button asChild className="rounded-2xl h-14 px-8 font-black uppercase tracking-tighter">
          <Link to="/auth">Iniciar Sincronização</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4 max-w-5xl space-y-12 reveal-on-scroll">
      <div className="space-y-4">
        <Badge variant="outline" className="px-5 py-2 rounded-full border-primary/30 bg-primary/5 text-primary glass-surface">
          <Bell className="w-3.5 h-3.5 mr-2 animate-pulse" />
          MONITOR DE PREÇO ATIVO
        </Badge>
        <h1 className="text-6xl md:text-7xl font-black italic uppercase tracking-[-0.07em] leading-none">Centro de Alertas</h1>
        <p className="text-muted-foreground font-medium tracking-tight border-l-2 border-primary/20 pl-6">
          Rastreamento em tempo real de deltas de preço e notificações de descoberta.
        </p>
      </div>

      <Tabs defaultValue="monitors" className="w-full space-y-8">
        <TabsList className="bg-glass border border-glass-border h-14 rounded-2xl p-1 w-full sm:w-auto">
          <TabsTrigger value="monitors" className="h-full rounded-xl px-8 font-black uppercase tracking-tighter italic data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            Monitores Ativos ({alerts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="h-full rounded-xl px-8 font-black uppercase tracking-tighter italic data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            Histórico de Sinais ({notifications?.filter(n => !n.read).length || 0} Novos)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitors" className="space-y-6">
          {loadingAlerts ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 rounded-3xl bg-muted/20 animate-pulse border border-glass-border" />
              ))}
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="grid gap-4">
              {alerts.map((alert: any) => (
                <Card key={alert.id} className="border-glass-border bg-glass backdrop-blur-xl rounded-3xl overflow-hidden hover:bg-white/5 transition-all group">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden flex-shrink-0">
                        <img 
                          src={alert.products?.images?.[0]} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0 border-primary/20 text-primary">
                            {alert.products?.marketplaces?.name}
                          </Badge>
                          {alert.products?.current_price <= alert.target_price && (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[8px] font-black uppercase tracking-widest">
                              Alvo Atingido
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-black italic uppercase tracking-tighter truncate leading-tight">
                          {alert.products?.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-tight text-muted-foreground">
                          <span>Atual: <span className="text-foreground">R$ {alert.products?.current_price}</span></span>
                          <span className="w-1 h-1 rounded-full bg-glass-border" />
                          <span>Alvo: <span className="text-primary">R$ {alert.target_price}</span></span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Button asChild className="flex-1 sm:flex-none rounded-xl font-black uppercase tracking-tighter italic h-12 px-6">
                        <Link to="/product/$slug" params={{ slug: alert.products?.slug }}>
                          Engajar Produto
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-12 h-12 rounded-xl text-destructive hover:bg-destructive/10 border border-glass-border"
                        onClick={() => deleteAlertMutation.mutate(alert.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-6 glass-surface rounded-[3rem] border border-glass-border">
              <div className="w-20 h-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto text-primary/20">
                <TrendingDown className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase">Nenhum Monitor Ativo</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Defina preços alvo nas páginas de produtos para iniciar a vigilância em tempo real.</p>
              </div>
              <Button asChild variant="outline" className="rounded-xl font-black uppercase tracking-tighter border-primary/20 text-primary">
                <Link to="/feed">Iniciar Descoberta</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loadingNotifs ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted/20 animate-pulse border border-glass-border" />
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="grid gap-3">
              {notifications.map((notif: any) => (
                <div 
                  key={notif.id}
                  className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                    notif.read 
                      ? 'bg-white/2 border-glass-border/50 opacity-60' 
                      : 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5'
                  }`}
                  onClick={() => !notif.read && markReadMutation.mutate(notif.id)}
                >
                  <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notif.type === 'price_drop' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'
                  }`}>
                    {notif.type === 'price_drop' ? <TrendingDown size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-sm font-black uppercase tracking-tight italic ${!notif.read && 'text-primary'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {notif.body}
                    </p>
                    {!notif.read && (
                      <div className="pt-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Sinal Não Lido</span>
                      </div>
                    )}
                  </div>
                  {notif.product_id && (
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" asChild>
                      <Link to="/search" search={{ q: notif.title }}>
                        <ExternalLink size={14} />
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-6 opacity-30">
              <Bell className="w-12 h-12 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest">Histórico de Sinais Vazio</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
