import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSocialProofConfig, updateSocialProofConfig } from '@/lib/social-proof.functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, ShieldAlert, Globe, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/admin/social-proof')({
  component: SocialProofAdmin,
});

function SocialProofAdmin() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ['socialProofConfig'],
    queryFn: () => getSocialProofConfig()
  });

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setFormData({
        is_enabled: (config as any).is_enabled,
        allowed_event_types: (config as any).allowed_event_types || [],
        min_interval_seconds: (config as any).min_interval_seconds || 30,
        recency_window_minutes: (config as any).recency_window_minutes || 120,
        show_aggregated_counters: (config as any).show_aggregated_counters ?? false,
        min_events_for_counter: (config as any).min_events_for_counter || 5,
        counter_window_hours: (config as any).counter_window_hours || 24,
        hybrid_simulation_enabled: (config as any).hybrid_simulation_enabled ?? false,
        show_location: (config as any).show_location ?? false,
        simulated_volume_boost: (config as any).simulated_volume_boost || 0,
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSocialProofConfig({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialProofConfig'] });
      toast.success("Configurações salvas com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    }
  });

  if (isLoading || !formData) return <div className="p-8">Loading...</div>;

  const eventTypes = [
    { id: 'ADD_FAVORITE', label: 'Favoritados' },
    { id: 'OUTBOUND_CLICK', label: 'Cliques em Ofertas' },
    { id: 'video_start', label: 'Início de Vídeos' },
    { id: 'video_complete', label: 'Conclusão de Vídeos' }
  ];

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Social Proof Core</h1>
          <p className="text-muted-foreground">Gerencie o sistema de prova social real do ecossistema.</p>
        </div>
        <Button onClick={handleSave} className="gap-2 font-black uppercase italic" disabled={updateMutation.isPending}>
          <Save size={18} />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-surface border-glass-border">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Status Global</CardTitle>
            <CardDescription>Ative ou desative o sistema em todo o app.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Pop-ups</Label>
              <p className="text-xs text-muted-foreground">Os usuários verão eventos reais recentes.</p>
            </div>
            <Switch 
              checked={formData.is_enabled} 
              onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })} 
            />
          </CardContent>
        </Card>

        <Card className="glass-surface border-glass-border">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Modo Híbrido (Inteligência)</CardTitle>
            <CardDescription>Mantenha o sistema ativo mesmo com baixo tráfego.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Simulação Histórica</Label>
              <p className="text-xs text-muted-foreground italic">Usa eventos reais antigos se não houver novos.</p>
            </div>
            <Switch 
              checked={formData.hybrid_simulation_enabled} 
              onCheckedChange={(checked) => setFormData({ ...formData, hybrid_simulation_enabled: checked })} 
            />
          </CardContent>
        </Card>

        <Card className="glass-surface border-glass-border">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Localização Espacial</CardTitle>
            <CardDescription>Exibe a origem geográfica do evento.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Cidade/Estado</Label>
              <p className="text-xs text-muted-foreground italic">Ex: "de Rio de Janeiro, RJ".</p>
            </div>
            <Switch 
              checked={formData.show_location} 
              onCheckedChange={(checked) => setFormData({ ...formData, show_location: checked })} 
            />
          </CardContent>
        </Card>

        <Card className="glass-surface border-glass-border">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-destructive flex items-center gap-2">
              <ShieldAlert size={16} />
              Protocolo de Veracidade
            </CardTitle>
            <CardDescription>Este sistema exibe apenas dados 100% reais.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Baseado exclusivamente na tabela analytics_events e histórico real.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-surface border-glass-border">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest">Eventos Elegíveis</CardTitle>
          <CardDescription>Escolha quais ações geram notificações sociais.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {eventTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-2 p-3 rounded-xl bg-white/5 border border-white/5">
              <Checkbox 
                id={type.id} 
                checked={formData.allowed_event_types.includes(type.id)}
                onCheckedChange={(checked) => {
                  const newTypes = checked 
                    ? [...formData.allowed_event_types, type.id]
                    : formData.allowed_event_types.filter((t: string) => t !== type.id);
                  setFormData({ ...formData, allowed_event_types: newTypes });
                }}
              />
              <Label htmlFor={type.id} className="font-bold">{type.label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-surface border-glass-border">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Tempo de Recência</CardTitle>
            <CardDescription>Eventos ocorridos há quantos minutos são considerados?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input 
                type="number" 
                value={formData.recency_window_minutes}
                onChange={(e) => setFormData({ ...formData, recency_window_minutes: parseInt(e.target.value) || 0 })}
                className="w-24 text-center font-bold"
              />
              <span className="text-sm font-medium">Minutos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-surface border-glass-border">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Intervalo de Exibição</CardTitle>
            <CardDescription>Espaço mínimo de tempo entre pop-ups.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input 
                type="number" 
                value={formData.min_interval_seconds}
                onChange={(e) => setFormData({ ...formData, min_interval_seconds: parseInt(e.target.value) || 0 })}
                className="w-24 text-center font-bold"
              />
              <span className="text-sm font-medium">Segundos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-surface border-glass-border">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest">Contadores Agregados (Sprint 14)</CardTitle>
          <CardDescription>Reforço de urgência e confiança baseado em números coletivos reais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Contadores</Label>
              <p className="text-xs text-muted-foreground italic">Exibe "N pessoas viram isso hoje" nos cards e produto.</p>
            </div>
            <Switch 
              checked={formData.show_aggregated_counters} 
              onCheckedChange={(checked) => setFormData({ ...formData, show_aggregated_counters: checked })} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest opacity-60">Mínimo de Eventos</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="number" 
                  value={formData.min_events_for_counter}
                  onChange={(e) => setFormData({ ...formData, min_events_for_counter: parseInt(e.target.value) || 0 })}
                  className="w-24 text-center font-bold"
                />
                <span className="text-xs font-medium">Eventos para começar a exibir</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest opacity-60">Janela de Tempo (Horas)</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="number" 
                  value={formData.counter_window_hours}
                  onChange={(e) => setFormData({ ...formData, counter_window_hours: parseInt(e.target.value) || 0 })}
                  className="w-24 text-center font-bold"
                />
                <span className="text-xs font-medium">Período de agregação</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest opacity-60">Volume Boost (%)</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="number" 
                  value={formData.simulated_volume_boost}
                  onChange={(e) => setFormData({ ...formData, simulated_volume_boost: parseInt(e.target.value) || 0 })}
                  className="w-24 text-center font-bold"
                />
                <span className="text-xs font-medium italic text-primary">Multiplicador de autoridade</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
