import { useEffect, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { BookOpen, Check, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = ["geral", "afiliado", "preços", "benefícios", "indicação", "funcionalidades", "conta"] as const;

type Faq = { id: string; question: string; answer: string; keywords: string[]; priority: number; is_active: boolean; created_at: string };

function readInitialQuestion(search: { question?: string }) {
  return typeof search.question === "string" ? search.question.trim().slice(0, 300) : "";
}

export function SupportKnowledgeBase() {
  const search = useSearch({ from: "/admin/support-knowledge" });
  const [items, setItems] = useState<Faq[]>([]);
  const [question, setQuestion] = useState(() => readInitialQuestion(search));
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [priority, setPriority] = useState("0");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("geral");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("support_faq").select("id,question,answer,keywords,priority,is_active,created_at").order("priority", { ascending: false }).order("created_at", { ascending: false });
    if (error) { toast.error("Não foi possível carregar a base de conhecimento"); console.error(error); }
    else setItems((data ?? []) as Faq[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const reset = () => { setEditingId(null); setQuestion(""); setAnswer(""); setKeywords(""); setPriority("0"); setCategory("geral"); };

  const edit = (item: Faq) => {
    setEditingId(item.id); setQuestion(item.question); setAnswer(item.answer); setKeywords(item.keywords?.join(", ") ?? ""); setPriority(String(item.priority));
    const found = CATEGORIES.find((value) => item.keywords?.includes(`categoria:${value}`));
    setCategory(found ?? "geral");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    const cleanQuestion = question.trim();
    const cleanAnswer = answer.trim();
    if (!cleanQuestion || !cleanAnswer) { toast.error("Pergunta e resposta são obrigatórias"); return; }
    setSaving(true);
    const rawKeywords = keywords.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean).filter((value) => !value.startsWith("categoria:"));
    const payload = { question: cleanQuestion, answer: cleanAnswer, keywords: Array.from(new Set([...rawKeywords, `categoria:${category}`])), priority: Math.max(0, Number.parseInt(priority, 10) || 0), is_active: true };
    const query = editingId ? (supabase as any).from("support_faq").update(payload).eq("id", editingId) : (supabase as any).from("support_faq").insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar o artigo"); console.error(error); return; }
    toast.success(editingId ? "Artigo atualizado" : "Artigo criado");
    reset();
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from("support_faq").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir o artigo"); console.error(error); return; }
    toast.success("Artigo excluído");
    if (editingId === id) reset();
    await load();
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary"><BookOpen className="h-3.5 w-3.5" /> Suporte</div><h1 className="text-3xl font-black uppercase italic tracking-tighter lg:text-5xl">Base de Conhecimento</h1><p className="mt-2 text-sm text-muted-foreground">Uma única fonte para as respostas usadas pelo atendimento.</p></div>
        <Button variant="outline" onClick={reset} className="gap-2 rounded-xl font-bold"><Plus className="h-4 w-4" /> Novo artigo</Button>
      </div>

      <Card className="rounded-3xl border-glass-border bg-glass-fallback backdrop-blur-xl">
        <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">{editingId ? "Editar artigo" : "Criar artigo"}</CardTitle><CardDescription>A pergunta pode chegar preenchida automaticamente a partir de uma lacuna.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2"><Label>Pergunta</Label><Input maxLength={300} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ex.: Como funciona o benefício X?" /></div>
          <div className="space-y-2"><Label>Resposta</Label><Textarea maxLength={3000} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Escreva uma resposta objetiva e confiável..." className="min-h-32 resize-y" /></div>
          <div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Categoria</Label><select value={category} onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="geral">Geral</option>{CATEGORIES.slice(1).map((value) => <option key={value} value={value}>{value}</option>)}</select></div><div className="space-y-2"><Label>Palavras-chave</Label><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="termo 1, termo 2" /></div><div className="space-y-2"><Label>Prioridade</Label><Input type="number" min={0} value={priority} onChange={(e) => setPriority(e.target.value)} /></div></div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={reset} disabled={saving}>Cancelar</Button><Button onClick={() => void save()} disabled={saving} className="gap-2 rounded-xl font-black">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{editingId ? "Salvar alterações" : "Publicar artigo"}</Button></div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-glass-border bg-glass-fallback backdrop-blur-xl"><CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Artigos ativos</CardTitle><CardDescription>{items.length} registro(s) na fonte de conhecimento do suporte.</CardDescription></CardHeader><CardContent>{loading ? <div className="flex items-center justify-center py-10 text-sm font-bold text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Carregando...</div> : items.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">Nenhum artigo cadastrado ainda.</div> : <div className="space-y-3">{items.map((item) => <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-border/60 p-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><p className="font-bold">{item.question}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.answer}</p><div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>{item.is_active ? "Ativo" : "Inativo"}</span><span>Prioridade {item.priority}</span></div></div><div className="flex shrink-0 gap-2"><Button size="sm" variant="outline" onClick={() => edit(item)}>Editar</Button><Button size="icon" variant="ghost" onClick={() => void remove(item.id)} aria-label={`Excluir ${item.question}`}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)}</div>}</CardContent></Card>
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs font-semibold text-muted-foreground"><Check className="h-4 w-4 shrink-0 text-emerald-500" />Esta tela grava diretamente em <code className="rounded bg-muted px-1">support_faq</code>, a mesma fonte que o chat público consulta.</div>
    </div>
  );
}
