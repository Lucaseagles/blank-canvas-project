import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const FALLBACK = "Ainda não encontrei uma resposta confiável para essa dúvida. Posso encaminhar você para um humano pelo WhatsApp para receber atendimento. 👇";
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

  try {
    const body = await req.json();
    const question = String(body?.question ?? "").trim();
    const sessionId = String(body?.sessionId ?? "").trim();
    if (question.length < 2 || question.length > 500) return json({ error: "Pergunta inválida" }, 400);
    if (!sessionId || sessionId.length > 120) return json({ error: "Sessão inválida" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: authData } = await authClient.auth.getUser();
    const userId = authData.user?.id ?? null;

    const { data: configRows } = await supabase.from("support_ai_config").select("config_key, config_value").in("config_key", ["ai_enabled", "ai_fallback_enabled", "ai_confidence_threshold", "gemini_model"]);
    const config = Object.fromEntries((configRows ?? []).map((row) => [row.config_key, row.config_value?.value]));
    const aiEnabled = config.ai_enabled !== false;
    const fallbackEnabled = config.ai_fallback_enabled !== false;
    const threshold = clamp(Number(config.ai_confidence_threshold ?? 0.30), 0.10, 0.90);
    const modelName = String(config.gemini_model ?? "gemini-2.5-flash");

    const { data: faqResult } = await supabase.rpc("search_knowledge_base", { search_query: question, min_similarity: threshold });
    const ranked = Array.isArray(faqResult) ? faqResult : [];
    const article = ranked[0];
    const articleScore = article ? Number(article.similarity_score) : 0;

    if (article && articleScore >= threshold) {
      await supabase.from("support_chat_log").insert({ user_id: userId, session_id: sessionId, question, matched_article_id: article.id, ai_used: false, ai_confidence: articleScore, confidence_score: articleScore, source: "faq" });
      return json({ answer: article.answer, source: "faq", confidence: articleScore, articleId: article.id });
    }

    if (!aiEnabled) {
      await supabase.from("support_chat_log").insert({ user_id: userId, session_id: sessionId, question, ai_used: false, confidence_score: 0, source: "fallback" });
      return json({ answer: FALLBACK, source: "fallback", confidence: 0 });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      await supabase.from("support_chat_log").insert({ user_id: userId, session_id: sessionId, question, ai_used: false, confidence_score: 0, source: "fallback" });
      return json({ answer: FALLBACK, source: "fallback", confidence: 0, reason: "gemini_not_configured" });
    }

    const knowledgeRows = ranked.slice(0, 8).filter((row: any) => Number(row.similarity_score) >= Math.max(0.10, threshold * 0.55));
    const knowledge = knowledgeRows.map((a: any) => `Pergunta: ${a.question}\nResposta: ${a.answer}\nRelevância: ${Number(a.similarity_score).toFixed(3)}`).join("\n\n");
    let userContext = "Usuário não logado";
    if (userId) {
      const { data: profile } = await supabase.from("profiles").select("display_name,total_referrals,current_tier_id").eq("user_id", userId).maybeSingle();
      if (profile) userContext = `Nome: ${profile.display_name || "Usuário"}. Indicações: ${profile.total_referrals ?? 0}.`;
    }

    const prompt = `Você é o assistente de suporte do app Offer Intelligence. Responda em português do Brasil, de forma curta, clara e amigável.\n\nREGRAS ABSOLUTAS:\n- Use somente o contexto fornecido.\n- Se a informação necessária não estiver no contexto, responda exatamente: "Não tenho essa informação".\n- Nunca invente preços, políticas, comissões, prazos, funcionalidades ou promessas.\n- Não revele dados pessoais além do contexto do usuário.\n- Não diga que executou ações que não executou.\n\nSOBRE O APP:\n- É uma plataforma de descoberta de produtos e ofertas com links de afiliado.\n- A compra é concluída no marketplace de origem; o app não processa o pagamento.\n\nCONTEXTO DO USUÁRIO:\n${userContext}\n\nCONTEXTO RELEVANTE DA BASE DE CONHECIMENTO:\n${knowledge || "Nenhum artigo suficientemente relevante foi encontrado."}\n\nPERGUNTA:\n${question}`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim();
      if (!answer || /não tenho essa informação/i.test(answer)) throw new Error("insufficient_context");

      // Gemini does not provide a calibrated support-confidence score here. Do not fabricate one.
      await supabase.from("support_chat_log").insert({ user_id: userId, session_id: sessionId, question, ai_used: true, ai_model: modelName, ai_confidence: null, confidence_score: null, source: "ai" });
      return json({ answer, source: "ai", confidence: null, model: modelName });
    } catch (aiError) {
      console.error("Gemini error", aiError);
      await supabase.from("support_chat_log").insert({ user_id: userId, session_id: sessionId, question, ai_used: false, confidence_score: 0, source: "error" });
      return json({ answer: fallbackEnabled ? FALLBACK : "Não consegui responder com segurança neste momento.", source: "fallback", confidence: 0 });
    }
  } catch (error) {
    console.error("support-ai error", error);
    return json({ answer: FALLBACK, source: "error", confidence: 0 }, 500);
  }
});