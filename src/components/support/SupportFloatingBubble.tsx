import * as React from "react";
import { Bot, ChevronDown, Loader2, MessageCircle, Phone, Send, Sparkles, User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SupportMessage = { id: string; type: "bot" | "user"; text: string; source?: "faq" | "ai" | "fallback" | "error" };
type FAQ = { question: string; answer: string; keywords: string[] | null; priority: number };

const FALLBACK_FAQS: FAQ[] = [
  { question: "Como funciona o link de afiliado?", answer: "Nós ajudamos você a descobrir produtos e ofertas. Ao clicar no link de afiliado, você é direcionado ao marketplace de origem para concluir a compra por lá. 🎯", keywords: ["afiliado", "link", "como funciona"], priority: 10 },
  { question: "Como funciona o alerta de preço?", answer: "Você pode monitorar um produto e definir um preço-alvo. Quando houver uma oportunidade compatível, o sistema pode gerar um alerta para você. 📉", keywords: ["alerta", "preço", "monitorar", "preco"], priority: 9 },
  { question: "Como salvar um produto?", answer: "Abra o produto e use o botão de favoritos. Seus produtos salvos ficam disponíveis no seu espaço de Favoritos. ❤️", keywords: ["favorito", "salvar", "salvos"], priority: 8 },
  { question: "O que é prova social?", answer: "São sinais baseados em eventos reais do sistema, usados para contextualizar interesse e atividade sobre produtos. Quando não há lastro suficiente, o sistema não deve fabricar números. 📊", keywords: ["prova social", "compras", "interesse"], priority: 7 },
  { question: "O que são pontos?", answer: "Pontos são recompensas da mecânica de gamificação. Eles podem ser obtidos por ações elegíveis e usados dentro das experiências de progresso, missões e badges. 🏆", keywords: ["pontos", "gamificação", "badge", "missão", "recompensa"], priority: 7 },
  { question: "Como comprar um produto?", answer: "Escolha o produto e use o botão para ir ao marketplace. A compra é finalizada na plataforma de origem; este app não simula checkout ou confirmação de compra. 🛍️", keywords: ["comprar", "compra", "checkout", "produto", "marketplace"], priority: 8 },
  { question: "Como funcionam os vídeos?", answer: "Os vídeos podem apresentar produtos e direcionar você para a plataforma de origem. O app não afirma que uma compra ocorreu apenas porque você assistiu ou clicou. 🎬", keywords: ["vídeo", "videos", "video", "tiktok", "shopee"], priority: 6 },
];

function getSessionId() {
  const key = "support_ai_session_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export function SupportFloatingBubble() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [faqs, setFaqs] = React.useState<FAQ[]>(FALLBACK_FAQS);
  const [whatsappNumber, setWhatsappNumber] = React.useState("5581995734813");
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<SupportMessage[]>([{ id: "welcome", type: "bot", text: "Olá! Como posso ajudar você hoje? 👋" }]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    const loadSupportConfig = async () => {
      const [{ data: faqData }, { data: configData }] = await Promise.all([
        (supabase as any).from("support_faq").select("question, answer, keywords, priority").eq("is_active", true).order("priority", { ascending: false }),
        (supabase as any).from("whatsapp_config").select("public_phone_number, is_active").eq("is_active", true).limit(1).maybeSingle(),
      ]);
      if (cancelled) return;
      if (Array.isArray(faqData) && faqData.length > 0) setFaqs(faqData as FAQ[]);
      if (configData?.public_phone_number) setWhatsappNumber(String(configData.public_phone_number).replace(/\D/g, ""));
      else if (import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER) setWhatsappNumber(String(import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER).replace(/\D/g, ""));
    };
    void loadSupportConfig();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const persistConversation = React.useCallback(async (nextMessages: SupportMessage[], handoff = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (conversationId) {
      await (supabase as any).from("support_conversations").update({ messages: nextMessages, whatsapp_handoff: handoff }).eq("id", conversationId).eq("user_id", user.id);
      return;
    }
    const { data } = await (supabase as any).from("support_conversations").insert({ user_id: user.id, messages: nextMessages, whatsapp_handoff: handoff }).select("id").single();
    if (data?.id) setConversationId(data.id);
  }, [conversationId]);

  const callSupportAI = React.useCallback(async (question: string) => {
    const sessionId = getSessionId();
    const { data, error } = await supabase.functions.invoke("support-ai", { body: { question, sessionId } });
    if (error) throw error;
    if (!data?.answer) throw new Error("Resposta vazia do suporte");
    return data as { answer: string; source: "faq" | "ai" | "fallback" | "error"; confidence?: number; model?: string };
  }, []);

  const handleSendMessage = async () => {
    const question = input.trim();
    if (!question || isTyping) return;
    const userMessage: SupportMessage = { id: crypto.randomUUID(), type: "user", text: question };
    const withUser = [...messages, userMessage];
    setMessages(withUser);
    setInput("");
    setIsTyping(true);
    void persistConversation(withUser);

    try {
      const result = await callSupportAI(question);
      const botMessage: SupportMessage = { id: crypto.randomUUID(), type: "bot", text: result.answer, source: result.source };
      const nextMessages = [...withUser, botMessage];
      setMessages(nextMessages);
      void persistConversation(nextMessages);
    } catch (error) {
      console.error("Support AI request failed", error);
      const fallback = "Ainda não consegui responder com segurança. Posso encaminhar você para um humano pelo WhatsApp para receber atendimento. 👇";
      const nextMessages = [...withUser, { id: crypto.randomUUID(), type: "bot" as const, text: fallback, source: "error" as const }];
      setMessages(nextMessages);
      void persistConversation(nextMessages);
    } finally {
      setIsTyping(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!whatsappNumber) return;
    const message = "Olá! Preciso de ajuda com o AffiliatePro.";
    const whatsappUrl = `https://wa.me/${whatsappNumber || "5581995734813"}?text=${encodeURIComponent(message)}`;
    window.location.href = whatsappUrl;
    await persistConversation(messages, true);
  };

  return (
    <>
      <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="support-floating-chat" aria-label={isOpen ? "Fechar suporte" : "Abrir suporte"} className={cn("fixed bottom-[84px] right-4 z-[110] flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:bottom-6 md:right-6", isOpen && "rotate-0 bg-foreground text-background")}>
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
      {isOpen && (
        <section id="support-floating-chat" aria-label="Central de suporte" className="fixed bottom-[148px] right-3 z-[109] flex h-[min(620px,72vh)] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-background/95 shadow-2xl shadow-black/30 backdrop-blur-2xl md:bottom-[88px] md:right-6">
          <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-primary/10 px-5 py-4">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Bot className="h-5 w-5" /></div><div><p className="font-black tracking-tight">Atendimento Inteligente</p><p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Base + IA ativa</p></div></div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Minimizar suporte" className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><ChevronDown className="h-5 w-5" /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 overscroll-contain">
            {messages.map((message) => <div key={message.id} className={cn("flex max-w-[90%] gap-2", message.type === "user" && "ml-auto flex-row-reverse")}><div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted", message.type === "user" && "bg-primary text-primary-foreground")}>{message.type === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}</div><div className={cn("whitespace-pre-line rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5 text-sm leading-relaxed", message.type === "user" && "rounded-tr-md rounded-tl-2xl bg-primary text-primary-foreground")}>{message.text}</div></div>)}
            {isTyping && <div className="flex items-center gap-2 text-muted-foreground"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-4 w-4" /></div><div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-xs font-bold"><Loader2 className="h-4 w-4 animate-spin" /> Processando…</div></div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="shrink-0 space-y-2 border-t border-white/10 bg-background/90 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground">Precisa de atendimento humano?</p>
              <button type="button" onClick={() => void handleWhatsApp()} disabled={!whatsappNumber} aria-label={whatsappNumber ? "Entrar no WhatsApp" : "WhatsApp não configurado"} title={whatsappNumber ? "Entrar no WhatsApp" : "WhatsApp não configurado"} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-all hover:scale-105 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"><Phone className="h-4 w-4" /></button>
            </div>
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-muted/40 p-1.5 focus-within:border-primary/40"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSendMessage(); } }} placeholder="Digite sua pergunta…" aria-label="Digite sua pergunta" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground" maxLength={500} /><button type="button" onClick={() => void handleSendMessage()} disabled={!input.trim() || isTyping} aria-label="Enviar pergunta" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button></div>
            <p className="flex items-center justify-center gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><Sparkles className="h-3 w-3" /> Respostas baseadas na base cadastrada + IA controlada</p>
          </div>
        </section>
      )}
    </>
  );
}
