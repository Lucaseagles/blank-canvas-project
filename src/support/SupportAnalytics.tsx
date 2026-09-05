import { useCallback, useEffect, useState } from "react";
import { Activity, BookOpen, CheckCircle2, MessageCircle, RefreshCw, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Conversation { id: string; user_id: string | null; messages: unknown; resolved: boolean | null; whatsapp_handoff: boolean | null; created_at: string; }

function messageCount(messages: unknown) { return Array.isArray(messages) ? messages.length : 0; }
function userMessageCount(messages: unknown) { return Array.isArray(messages) ? messages.filter((m) => typeof m === "object" && m !== null && (m as { type?: string }).type === "user").length : 0; }

export function SupportAnalytics() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [faqCount, setFaqCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [{ data: convs, error: convError }, { count, error: faqError }] = await Promise.all([
        (supabase as any).from("support_conversations").select("id,user_id,messages,resolved,whatsapp_handoff,created_at").order("created_at", { ascending: false }).limit(500),
        (supabase as any).from("support_faq").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      if (convError) throw convError;
      if (faqError) throw faqError;
      setConversations((convs ?? []) as Conversation[]); setFaqCount(count ?? 0);
    } catch (err) { console.error("Erro ao carregar analytics do suporte:", err); setError("Não foi possível carregar as análises agora."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const total = conversations.length;
  const resolved = conversations.filter((c) => c.resolved === true).length;
  const handoffs = conversations.filter((c) => c.whatsapp_handoff === true).length;
  const questions = conversations.reduce((sum, c) => sum + userMessageCount(c.messages), 0);
  const activeUsers = new Set(conversations.map((c) => c.user_id).filter(Boolean)).size;
  const avgMessages = total ? conversations.reduce((sum, c) => sum + messageCount(c.messages), 0) / total : 0;
  const resolutionRate = total ? (resolved / total) * 100 : 0;
  const cards = [
    { title: "Conversas", value: total.toLocaleString("pt-BR"), icon: MessageCircle, detail: "Registros analisados" },
    { title: "Perguntas", value: questions.toLocaleString("pt-BR"), icon: Activity, detail: "Mensagens de usuários" },
    { title: "Resolvidas", value: `${resolutionRate.toFixed(1)}%`, icon: CheckCircle2, detail: `${resolved} conversa(s)` },
    { title: "WhatsApp", value: handoffs.toLocaleString("pt-BR"), icon: Send, detail: "Handoffs registrados" },
    { title: "Usuários", value: activeUsers.toLocaleString("pt-BR"), icon: Users, detail: "Usuários identificados" },
    { title: "Base ativa", value: faqCount.toLocaleString("pt-BR"), icon: BookOpen, detail: "Artigos disponíveis" },
  ];

  if (loading) return <div className="flex min-h-40 items-center justify-center rounded-3xl border border-border/60 bg-card/50 p-8 text-sm font-bold text-muted-foreground"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Carregando análises...</div>;
  if (error) return <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 text-sm font-semibold text-destructive">{error}<button type="button" onClick={() => void load()} className="ml-3 underline">Tentar novamente</button></div>;

  return <section className="space-y-6" aria-label="Análises do suporte">
    <div className="flex items-center justify-between"><div><h2 className="text-xl font-black uppercase italic tracking-tight">Performance do Suporte</h2><p className="mt-1 text-xs text-muted-foreground">Métricas calculadas diretamente dos registros de atendimento.</p></div><button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 px-3 text-xs font-bold hover:bg-muted"><RefreshCw className="h-4 w-4" />Atualizar</button></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map((card) => <Card key={card.title} className="rounded-3xl border-glass-border bg-glass-fallback backdrop-blur-xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{card.title}</CardTitle><card.icon className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-3xl font-black tracking-tighter">{card.value}</div><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{card.detail}</p></CardContent></Card>)}</div>
    <Card className="rounded-3xl border-glass-border bg-glass-fallback backdrop-blur-xl"><CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Profundidade média</CardTitle></CardHeader><CardContent><div className="flex items-end gap-3"><span className="text-4xl font-black tracking-tighter">{avgMessages.toFixed(1)}</span><span className="pb-1 text-xs font-bold text-muted-foreground">mensagens por conversa</span></div><p className="mt-3 text-xs text-muted-foreground">A métrica usa apenas as conversas disponíveis nos últimos 500 registros carregados nesta tela.</p></CardContent></Card>
  </section>;
}
