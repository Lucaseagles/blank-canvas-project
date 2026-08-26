// # SPRINT 14 (PARTE 3/3) — GAMIFICATION ENGINE
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { updateSocialProofOptOut } from "@/lib/social-proof.functions";
import { User, Shield, Sparkles, LogOut, CheckCircle2, Bell, Zap, Share2, Copy, Users, Eye, Gift, Award, Star, Trophy, Target, Flame } from "lucide-react";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { getReferralInfo } from "@/lib/referral.functions";
import { useServerFn } from "@tanstack/react-start";
import { getUserGamificationStats } from "@/lib/gamification.functions";
import { GamificationDashboard } from "@/components/GamificationDashboard";
import { useActivityTracker } from "@/hooks/useActivityTracker";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Perfil e Discovery IQ — Sua Conta" },
      { name: "description", content: "Gerencie preferências, acompanhe pontos, badges, streak e missões do seu perfil de descoberta." },
      { property: "og:title", content: "Perfil e Discovery IQ — Sua Conta" },
      { property: "og:description", content: "Gerencie preferências, acompanhe pontos, badges, streak e missões do seu perfil de descoberta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});


function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  
  // Sprint 14: Daily Streak Tracker
  useActivityTracker();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      } else {
        navigate({ to: "/auth" });
      }
    });
  }, [navigate]);


  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      setDisplayName(data.display_name || "");
      return data;
    },
    enabled: !!userId,
  });

  const { data: preferences } = useQuery({
    queryKey: ["user-preferences", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setSelectedCategories(data.preferred_categories || []);
        setSelectedMarketplaces(data.preferred_marketplaces || []);
      }
      return data;
    },
    enabled: !!userId,
  });

  const { data: interests } = useQuery({
    queryKey: ["user-interests", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_interests")
        .select("score, categories(name)")
        .eq("user_id", userId)
        .order("score", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: categories } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: marketplaces } = useQuery({
    queryKey: ["all-marketplaces"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketplaces").select("id, name").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const getGamificationFn = useServerFn(getUserGamificationStats);
  const { data: gamification } = useQuery({
    queryKey: ["gamification-stats", userId],
    queryFn: () => getGamificationFn({ data: {} as any }),
    enabled: !!userId,
  });

  const updateProfile = useMutation({

    mutationFn: async () => {
      if (!userId) throw new Error("Not logged in");
      
      // Update display name
      const { error: pError } = await supabase
        .from("profiles")
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (pError) throw pError;

      // Update preferences
      const { data: existingPref } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingPref) {
        const { error: prefError } = await supabase
          .from("user_preferences")
          .update({
            preferred_categories: selectedCategories,
            preferred_marketplaces: selectedMarketplaces,
            updated_at: new Date().toISOString()
          } as any)
          .eq("user_id", userId);
        if (prefError) throw prefError;
      } else {
        const { error: prefError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: userId,
            preferred_categories: selectedCategories,
            preferred_marketplaces: selectedMarketplaces
          });
        if (prefError) throw prefError;
      }
      
      await trackEvent('PREFERENCE_UPDATED', { display_name: displayName, categories: selectedCategories });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-preferences", userId] });
      toast.success("Protocolos de identidade atualizados com sucesso");
    },
    onError: (error) => {
      toast.error("Falha na atualização do protocolo: " + error.message);
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Conexão terminada.");
    navigate({ to: "/auth" });
  };

  if (!userId) return null;

  return (
    <div className="container mx-auto py-24 px-4 max-w-5xl pb-safe">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <Card className="border-glass-border bg-glass backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="h-24 bg-primary/10 relative">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl border-4 border-background overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <User size={40} className="relative z-10" />
              </div>
            </div>
            <CardContent className="pt-14 pb-8 text-center space-y-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">{displayName || "Operator"}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">ID Neural: {userId.slice(0, 8)}...</p>
              
              <div className="pt-6">
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold uppercase tracking-widest text-[10px]"
                  onClick={handleLogout}
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Terminar Sessão
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interest Intelligence */}
          <Card className="border-glass-border bg-glass backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <Shield className="w-3 h-3" />
                QI de Descoberta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {interests && interests.length > 0 ? (
                interests.slice(0, 5).map((interest: any, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                      <span>{interest.categories?.name}</span>
                      <span className="text-primary">{interest.score}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (interest.score / (interests[0]?.score || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-2 opacity-30">
                  <Sparkles className="w-8 h-8 mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Aguardando Sinais de Dados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs defaultValue="identity" className="w-full space-y-6">
            <TabsList className="bg-glass border border-glass-border h-14 rounded-2xl p-1 w-full grid grid-cols-5">
              <TabsTrigger value="identity" className="h-full rounded-xl font-black uppercase tracking-tighter italic data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Identidade
              </TabsTrigger>
              <TabsTrigger value="gamification" className="h-full rounded-xl font-black uppercase tracking-tighter italic data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Neural XP Dashboard
              </TabsTrigger>
              <TabsTrigger value="preferences" className="h-full rounded-xl font-black uppercase tracking-tighter italic data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Protocolos de Descoberta
              </TabsTrigger>
              <TabsTrigger value="notifications" className="h-full rounded-xl font-black uppercase tracking-tighter italic data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Sinais
              </TabsTrigger>
              <TabsTrigger value="referral" className="h-full rounded-xl font-black uppercase tracking-tighter italic data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Rede
              </TabsTrigger>
            </TabsList>


            <TabsContent value="gamification" className="space-y-6">
              <GamificationDashboard 
                points={gamification?.points || 0}
                streak={gamification?.streak || 0}
                badges={gamification?.badges || []}
                missions={gamification?.missions || []}
              />
            </TabsContent>

            <TabsContent value="identity">

              <Card className="border-glass-border bg-glass backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
                <CardHeader className="p-10 pb-6">
                  <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Identidade Central</CardTitle>
                  <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground/60">Gerencie seus identificadores de sistema</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Alias: Nome de Exibição</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-14 rounded-2xl bg-white/5 border-glass-border focus:ring-primary/20 font-medium text-lg"
                      placeholder="Nome do operador neural"
                    />
                  </div>

                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-tight text-xs">Segurança Verificada</p>
                      <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Criptografia de ponta a ponta ativa</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => updateProfile.mutate()}
                    className="w-full h-16 rounded-2xl text-lg font-black italic uppercase tracking-tight shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? "Sincronizando..." : "Atualizar Protocolo"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card className="border-glass-border bg-glass backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
                <CardHeader className="p-10 pb-6">
                  <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Protocolos de Descoberta</CardTitle>
                  <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground/60">Ajuste a inteligência do seu feed</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Setores Priorizados (Categorias)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {categories?.map((cat) => (
                        <div 
                          key={cat.id}
                          className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            selectedCategories.includes(cat.id) 
                              ? 'bg-primary/10 border-primary text-primary' 
                              : 'bg-white/5 border-glass-border hover:bg-white/10'
                          }`}
                          onClick={() => {
                            if (selectedCategories.includes(cat.id)) {
                              setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                            } else {
                              setSelectedCategories([...selectedCategories, cat.id]);
                            }
                          }}
                        >
                          <Checkbox checked={selectedCategories.includes(cat.id)} className="border-primary" />
                          <span className="text-[10px] font-black uppercase tracking-tight leading-none">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Nós Confiáveis (Marketplaces)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {marketplaces?.map((market) => (
                        <div 
                          key={market.id}
                          className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            selectedMarketplaces.includes(market.id) 
                              ? 'bg-blue-600/10 border-blue-500 text-blue-500' 
                              : 'bg-white/5 border-glass-border hover:bg-white/10'
                          }`}
                          onClick={() => {
                            if (selectedMarketplaces.includes(market.id)) {
                              setSelectedMarketplaces(selectedMarketplaces.filter(id => id !== market.id));
                            } else {
                              setSelectedMarketplaces([...selectedMarketplaces, market.id]);
                            }
                          }}
                        >
                          <Checkbox checked={selectedMarketplaces.includes(market.id)} className="border-blue-500" />
                          <span className="text-[10px] font-black uppercase tracking-tight leading-none">{market.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={() => updateProfile.mutate()}
                    className="w-full h-16 rounded-2xl text-lg font-black italic uppercase tracking-tight shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? "Calibrating..." : "Calibrate Discovery IQ"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationSettings userId={userId} />
            </TabsContent>
            <TabsContent value="referral">
              <ReferralPanel userId={userId} />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  );
}

function NotificationSettings({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { webPush, updatePreferences } = useNotificationPreferences(userId);
  
  const { data: socialProofOptIn } = useQuery({
    queryKey: ["social-proof-opt-in", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      return (data as any)?.show_in_social_proof !== false;
    },
    enabled: !!userId,
  });

  const optOutMutation = useMutation({
    mutationFn: (enabled: boolean) => updateSocialProofOptOut({ data: { userId, enabled } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-proof-opt-in", userId] });
      toast.success("Privacy protocol updated");
    }
  });
  
  const { data: pushPrefs } = useQuery({
    queryKey: ["notification-preferences", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as any) || { push_enabled: true, retention_enabled: true };
    },
    enabled: !!userId,
  });

  return (
    <Card className="border-glass-border bg-glass backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
      <CardHeader className="p-10 pb-6">
        <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Signal Management</CardTitle>
        <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground/60">Configure real-time neural triggers</CardDescription>
      </CardHeader>
      <CardContent className="p-10 pt-0 space-y-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-glass-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h4 className="font-black italic uppercase tracking-tight">Real-Time Web Push</h4>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Receive signals even when offline</p>
            </div>
            <Switch 
              checked={!!(pushPrefs?.push_enabled && webPush.isSubscribed)}
              onCheckedChange={(checked) => {
                updatePreferences.mutate({ 
                  push_enabled: checked,
                  togglePushSubscription: true
                });
              }}
              disabled={!webPush.isSupported || updatePreferences.isPending || webPush.isPending}
            />
          </div>

          <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-glass-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h4 className="font-black italic uppercase tracking-tight">Retention Pulse</h4>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Smart re-engagement triggers</p>
            </div>
            <Switch 
              checked={!!pushPrefs?.retention_enabled}
              onCheckedChange={(checked) => {
                updatePreferences.mutate({ retention_enabled: checked });
              }}
              disabled={updatePreferences.isPending}
            />
          </div>

          <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-glass-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h4 className="font-black italic uppercase tracking-tight">Social Proof Transparency</h4>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Show your activity to others (anonymized)</p>
            </div>
            <Switch 
              checked={socialProofOptIn !== false}
              onCheckedChange={(checked) => {
                optOutMutation.mutate(checked);
              }}
              disabled={optOutMutation.isPending}
            />
          </div>

          {!webPush.isSupported && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest text-center">
              Web Push is not supported by this browser/OS.
            </div>
          )}
        </div>

        <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <h5 className="font-black italic uppercase tracking-tighter">Active Protocol Summary</h5>
          </div>
          <ul className="space-y-2">
            {[
              { label: 'Price Alerts', active: true },
              { label: 'Neural Feed Sync', active: pushPrefs?.retention_enabled },
              { label: 'Marketplace Deals', active: true }
            ].map((protocol, i) => (
              <li key={i} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">{protocol.label}</span>
                <Badge variant="outline" className={protocol.active ? 'text-primary border-primary/20' : 'opacity-30'}>
                  {protocol.active ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralPanel({ userId }: { userId: string }) {
  const getReferralFn = useServerFn(getReferralInfo);
  
  const { data: referral, isLoading } = useQuery({
    queryKey: ["referral-info", userId],
    queryFn: () => getReferralFn({ data: {} as any }),
    enabled: !!userId,
  });

  const { data: userRewards } = useQuery({
    queryKey: ['user-rewards', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_rewards')
        .select(`
          milestone_id,
          referral_milestones (
            name,
            reward_type,
            target_activations
          )
        `)
        .eq('user_id', userId);
      return data || [];
    },
    enabled: !!userId,
  });

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth?ref=${referral?.code}` 
    : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join AFFILIATEPRO',
          text: 'Use my code to join the future of commerce discovery!',
          url: referralLink,
        });
        trackEvent('REFERRAL_SHARE_INTENT', { method: 'web_share' });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied to neural clipboard!");
      trackEvent('REFERRAL_SHARE_INTENT', { method: 'clipboard' });
    }
  };

  return (
    <Card className="border-glass-border bg-glass backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
      <CardHeader className="p-10 pb-6">
        <CardTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Network Expansion
        </CardTitle>
        <CardDescription className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground/60">Amplify the ecosystem & unlock rewards</CardDescription>
      </CardHeader>
      <CardContent className="p-10 pt-0 space-y-10">
        <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-6 text-center">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Your Unique ID</h4>
            <div className="text-4xl font-black tracking-widest text-foreground select-all uppercase italic">
              {isLoading ? '...' : referral?.code}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleShare}
              className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest gap-2 italic"
              disabled={isLoading}
            >
              <Share2 className="w-4 h-4" />
              Spread Network
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
                toast.success("Link copied!");
              }}
              className="h-14 w-14 rounded-xl border-glass-border"
              disabled={isLoading}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Invited', value: referral?.stats.invited, icon: Users },
            { label: 'Registered', value: referral?.stats.registered, icon: CheckCircle2 },
            { label: 'Activated', value: referral?.stats.activated, icon: Zap },
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center space-y-2">
              <stat.icon className="w-4 h-4 mx-auto text-primary/60" />
              <div className="text-2xl font-black italic">{stat.value || 0}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ecosystem Milestones</h4>
          <div className="space-y-3">
            {[
              { target: 3, label: 'Early Access Protocol', unlocked: (referral?.stats.activated || 0) >= 3 || userRewards?.some((r: any) => r.referral_milestones.target_activations === 3) },
              { target: 5, label: 'Discovery Multiplier', unlocked: (referral?.stats.activated || 0) >= 5 || userRewards?.some((r: any) => r.referral_milestones.target_activations === 5) },
              { target: 10, label: 'Neural Ambassador Badge', unlocked: (referral?.stats.activated || 0) >= 10 || userRewards?.some((r: any) => r.referral_milestones.target_activations === 10) },
            ].map((milestone, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${milestone.unlocked ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${milestone.unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {milestone.target}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight">{milestone.label}</span>
                </div>
                {milestone.unlocked ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Shield className="w-4 h-4 text-muted-foreground/30" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

  );
}
