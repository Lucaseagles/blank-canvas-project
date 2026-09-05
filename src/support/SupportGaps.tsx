import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Lightbulb, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Gap {
  question: string;
  count: number;
  last_asked: string;
  category?: string;
}

interface SupportGapRow {
  question: string | null;
  created_at: string | null;
  matched_article_id?: string | null;
}

interface SupportMessage {
  type?: "bot" | "user" | string;
  text?: string;
}

interface SupportConversation {
  messages: unknown;
  updated_at: string | null;
  created_at: string | null;
}

interface SupportGapsProps {
  onCreateArticle?: (question: string) => void;
}

const FALLBACK_UNANSWERED_MESSAGE =
  "Ainda não encontrei uma resposta confiável para essa dúvida na nossa base.";

function normalizeQuestion(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMessages(value: unknown): SupportMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((message): message is SupportMessage => {
    return typeof message === "object" && message !== null;
  });
}

function isUnansweredExchange(messages: SupportMessage[], index: number) {
  const message = messages[index];
  if (message.type !== "user" || !message.text?.trim()) return false;

  const nextBot = messages
    .slice(index + 1)
    .find((candidate) => candidate.type === "bot");

  return Boolean(
    nextBot?.text &&
      normalizeQuestion(nextBot.text).includes(
        normalizeQuestion(FALLBACK_UNANSWERED_MESSAGE),
      ),
  );
}

export function SupportGaps({ onCreateArticle }: SupportGapsProps) {
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadGaps = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // Preferred source: a dedicated unanswered-question log, when available.
      const { data: logData, error: logError } = await (supabase as any)
        .from("support_chat_log")
        .select("question, created_at, matched_article_id")
        .is("matched_article_id", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!logError && Array.isArray(logData)) {
        const grouped = logData.reduce(
          (acc: Record<string, Gap>, item: SupportGapRow) => {
            const question = item.question?.trim();
            if (!question || !item.created_at) return acc;

            const key = normalizeQuestion(question);
            if (!key) return acc;

            if (!acc[key]) {
              acc[key] = {
                question,
                count: 0,
                last_asked: item.created_at,
              };
            }

            acc[key].count += 1;
            if (
              new Date(item.created_at).getTime() >
              new Date(acc[key].last_asked).getTime()
            ) {
              acc[key].last_asked = item.created_at;
            }

            return acc;
          },
          {},
        );

        setGaps(
          Object.values(grouped).sort(
            (a, b) => b.count - a.count || b.last_asked.localeCompare(a.last_asked),
          ),
        );
        return;
      }

      // Current production schema stores support exchanges in support_conversations.
      // Fall back to it so this panel remains functional before a dedicated log exists.
      const { data: conversations, error: conversationsError } = await (
        supabase as any
      )
        .from("support_conversations")
        .select("messages, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);

      if (conversationsError) throw conversationsError;

      const grouped: Record<string, Gap> = {};

      for (const conversation of (conversations ?? []) as SupportConversation[]) {
        const messages = parseMessages(conversation.messages);
        messages.forEach((message, index) => {
          if (!isUnansweredExchange(messages, index)) return;

          const question = message.text?.trim();
          if (!question) return;

          const key = normalizeQuestion(question);
          if (!key) return;

          const askedAt = conversation.updated_at ?? conversation.created_at;
          if (!askedAt) return;

          if (!grouped[key]) {
            grouped[key] = {
              question,
              count: 0,
              last_asked: askedAt,
            };
          }

          grouped[key].count += 1;
          if (
            new Date(askedAt).getTime() >
            new Date(grouped[key].last_asked).getTime()
          ) {
            grouped[key].last_asked = askedAt;
          }
        });
      }

      setGaps(
        Object.values(grouped).sort(
          (a, b) => b.count - a.count || b.last_asked.localeCompare(a.last_asked),
        ),
      );
    } catch (error) {
      console.error("Erro ao carregar lacunas de conhecimento:", error);
      setGaps([]);
      setErrorMessage("Não foi possível carregar as lacunas agora.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGaps();
  }, [loadGaps]);

  const handleCreateArticle = (question: string) => {
    onCreateArticle?.(question);
  };

  if (loading) {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-2xl border border-border/60 bg-card/60 p-6 text-sm font-semibold text-muted-foreground">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Carregando lacunas...
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="support-gaps-title">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 id="support-gaps-title" className="font-black tracking-tight">
              Lacunas de Conhecimento
            </h3>
            <p className="text-xs font-medium text-muted-foreground">
              {gaps.length} {gaps.length === 1 ? "pergunta sem resposta" : "perguntas sem resposta"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border/70 px-3 text-xs font-bold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void loadGaps()}
          disabled={loading}
          aria-label="Atualizar lacunas de conhecimento"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-semibold text-destructive">
          {errorMessage}
        </div>
      ) : gaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <Check className="h-6 w-6" />
          </div>
          <p className="font-bold">🎉 Nenhuma lacuna encontrada!</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Sua base de conhecimento não registrou dúvidas sem resposta.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {gaps.slice(0, 20).map((gap) => (
            <article
              key={normalizeQuestion(gap.question)}
              className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm transition-all hover:border-primary/30 hover:bg-card/80 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-bold leading-relaxed">
                  {gap.question}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-1 font-black text-primary">
                    {gap.count}x
                  </span>
                  <span>
                    Última: {new Date(gap.last_asked).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-black text-primary-foreground shadow-sm transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => handleCreateArticle(gap.question)}
                disabled={!onCreateArticle}
                title={
                  onCreateArticle
                    ? "Criar artigo a partir desta pergunta"
                    : "Conecte este painel ao formulário de artigos"
                }
              >
                <Lightbulb className="h-4 w-4" />
                Criar artigo
              </button>
            </article>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs font-medium leading-relaxed text-muted-foreground">
        💡 Estas são perguntas que os usuários fizeram mas não encontraram resposta.
        Transforme as mais recorrentes em artigos para fortalecer a base de conhecimento.
      </div>
    </section>
  );
}
