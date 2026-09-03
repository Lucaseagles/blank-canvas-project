import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Power, PowerOff, RefreshCw } from "lucide-react";
import { getAdminBadges, setBadgeEnabled, type BadgeConfig as Badge } from "@/lib/admin-modules.functions";
import { Button } from "@/components/ui/button";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BadgeConfig() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin-badges"], queryFn: () => getAdminBadges({ data: undefined }) });
  const [badges, setBadges] = useState<Badge[]>([]);
  useEffect(() => { if (query.data) setBadges(query.data); }, [query.data]);
  const toggle = useMutation({ mutationFn: (b: Badge) => setBadgeEnabled({ data: { id: b.id, enabled: !b.is_enabled } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-badges"] }) });
  if (query.isLoading) return <div className="py-12 text-center text-muted-foreground">Carregando badges...</div>;
  if (query.isError) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">Não foi possível carregar os badges.</div>;
  return <Card className="border-white/10 bg-background/60 backdrop-blur-xl"><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle className="text-2xl font-black uppercase italic">Badges e Selos</CardTitle><p className="mt-1 text-sm text-muted-foreground">Controle quais selos podem aparecer na loja pública.</p></div><Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={query.isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />Recarregar</Button></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{badges.map((badge) => <div key={badge.id} className="flex items-center gap-4 rounded-2xl border border-white/10 p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg" style={badge.color ? { backgroundColor: badge.color } : undefined}>{badge.icon ?? "🏷️"}</div><div className="min-w-0 flex-1"><p className="font-bold">{badge.badge_name}</p><p className="text-xs text-muted-foreground">{badge.badge_key} · {badge.badge_text}</p>{badge.threshold && <p className="mt-1 text-[10px] text-muted-foreground">Regra: {JSON.stringify(badge.threshold)}</p>}</div><UiBadge variant={badge.is_enabled ? "default" : "secondary"}>{badge.is_enabled ? "Ativo" : "Inativo"}</UiBadge><Button variant="ghost" size="sm" onClick={() => toggle.mutate(badge)} disabled={toggle.isPending}>{badge.is_enabled ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}{badge.is_enabled ? "Desativar" : "Ativar"}</Button></div>)}</CardContent></Card>;
}
