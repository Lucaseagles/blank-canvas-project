import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from '@/lib/auth-guards.server';
import { getIntegrationSecretServer } from '@/integrations/secrets.server';

const ConfigSchema = z.object({ channelId: z.string().trim().min(1).max(200), isActive: z.boolean(), botToken: z.string().trim().min(1).max(500).optional().nullable() });

async function getConfig(supabaseAdmin: any) { const { data, error } = await supabaseAdmin.from('telegram_config').select('id,channel_id,is_active,updated_at').maybeSingle(); if (error) throw error; return data as any; }
async function getTelegramCredentials() { const [token, channelId] = await Promise.all([getIntegrationSecretServer('telegram', 'bot_token'), getIntegrationSecretServer('telegram', 'channel_id')]); return { token: token?.trim() || null, channelId: channelId?.trim() || null }; }
async function sendTelegramWithOutbox(
  supabaseAdmin: any,
  input: { operationKey: string; productId: string | null; message: string; messageKind: "manual" | "test"; actorId: string },
  credentials: { token: string; channelId: string },
) {
  const { data: prepared, error: prepareError } = await (supabaseAdmin as any).rpc("rubi_prepare_telegram_send_audited", {
    p_operation_key: input.operationKey,
    p_product_id: input.productId,
    p_message_text: input.message,
    p_message_kind: input.messageKind,
    p_actor: input.actorId,
  });
  if (prepareError) throw new Error(`Não foi possível preparar e auditar o envio: ${prepareError.message}`);
  const operation = Array.isArray(prepared) ? prepared[0] : prepared;
  if (!operation?.message_id) throw new Error("A operação de envio não retornou um identificador válido.");
  if (!operation.should_send) {
    return {
      success: operation.status === "sent",
      status: operation.status as string,
      telegram_message_id: null as string | null,
      error: operation.status === "sent"
        ? undefined
        : "Esta operação já foi iniciada ou encerrada. Ela não será reenviada automaticamente para evitar duplicidade.",
    };
  }

  let response: Response;
  let payload: any;
  try {
    response = await fetch(`https://api.telegram.org/bot${credentials.token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: credentials.channelId,
        text: input.message,
        ...(input.messageKind === "manual" ? { parse_mode: "HTML" } : {}),
      }),
    });
    payload = await response.json();
  } catch {
    const { error } = await (supabaseAdmin as any).rpc("rubi_finalize_telegram_send_audited", {
      p_message_id: operation.message_id,
      p_status: "unknown",
      p_provider_message_id: null,
      p_result_code: "network_unknown",
      p_actor: input.actorId,
    });
    if (error) throw new Error("O resultado do Telegram ficou indeterminado e não foi possível registrar a reconciliação. Não reenvie esta operação.");
    return { success: false, status: "unknown", telegram_message_id: null, error: "Resposta de rede indeterminada. O envio foi bloqueado para evitar mensagem duplicada." };
  }

  if (!response.ok || payload?.ok !== true) {
    const { error } = await (supabaseAdmin as any).rpc("rubi_finalize_telegram_send_audited", {
      p_message_id: operation.message_id,
      p_status: "failed",
      p_provider_message_id: null,
      p_result_code: "telegram_rejected",
      p_actor: input.actorId,
    });
    if (error) throw new Error("O Telegram rejeitou a mensagem, mas não foi possível registrar o resultado.");
    return { success: false, status: "failed", telegram_message_id: null, error: "O Telegram rejeitou a mensagem. Revise o canal e o conteúdo antes de criar uma nova operação." };
  }

  const providerMessageId = payload?.result?.message_id;
  if (providerMessageId === undefined || providerMessageId === null) {
    const { error } = await (supabaseAdmin as any).rpc("rubi_finalize_telegram_send_audited", {
      p_message_id: operation.message_id,
      p_status: "unknown",
      p_provider_message_id: null,
      p_result_code: "response_invalid",
      p_actor: input.actorId,
    });
    if (error) throw new Error("O Telegram pode ter aceitado a mensagem, mas a resposta inválida não pôde ser registrada. Não reenvie.");
    return { success: false, status: "unknown", telegram_message_id: null, error: "O Telegram retornou uma resposta sem identificador. O envio foi bloqueado para evitar duplicidade." };
  }

  const { error: finalizeError } = await (supabaseAdmin as any).rpc("rubi_finalize_telegram_send_audited", {
    p_message_id: operation.message_id,
    p_status: "sent",
    p_provider_message_id: String(providerMessageId),
    p_result_code: null,
    p_actor: input.actorId,
  });
  if (finalizeError) {
    return { success: false, status: "unknown", telegram_message_id: String(providerMessageId), error: "O Telegram aceitou a mensagem, mas o registro final falhou. Não reenvie; reconcilie esta operação no painel." };
  }
  return { success: true, status: "sent", telegram_message_id: String(providerMessageId) };
}


export const getTelegramConfig = createServerFn({ method: "GET" }).middleware([requireOwnerRole]).handler(async () => { const { supabaseAdmin } = await import('@/integrations/supabase/client.server'); const config = await getConfig(supabaseAdmin); const { token, channelId } = await getTelegramCredentials(); return config ? { id: config.id, channel_id: channelId || config.channel_id, is_active: config.is_active, hasToken: Boolean(token) } : { id: null, channel_id: channelId, is_active: false, hasToken: Boolean(token) }; });

export const saveTelegramConfig = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => ConfigSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: result, error } = await (supabaseAdmin as any).rpc('rubi_save_telegram_config_audited', {
      p_channel_id: data.channelId,
      p_is_active: data.isActive,
      p_bot_token: data.botToken ?? null,
      p_actor: context.userId,
    });
    if (error) throw new Error(`Não foi possível salvar e auditar a configuração do Telegram: ${error.message}`);
    return { success: true, hasToken: Boolean(result?.has_token) };
  });

export const testTelegramConnection = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ operationKey: z.string().uuid(), message: z.string().trim().min(1).max(4000).default("🧪 Mensagem de teste do Admin") }).parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const config = await getConfig(supabaseAdmin);
    if (!config?.is_active) return { success: false, status: "not_started", error: "Telegram integration is inactive." };
    const { token, channelId } = await getTelegramCredentials();
    if (!token || !channelId) return { success: false, status: "not_started", error: "Telegram Bot Token ou Channel ID não está configurado no Secure Hub." };
    return sendTelegramWithOutbox(supabaseAdmin, {
      operationKey: data.operationKey, productId: null, message: data.message,
      messageKind: "test", actorId: context.userId,
    }, { token, channelId });
  });

export const composeTelegramMessage = createServerFn({ method: "POST" }).middleware([requireOwnerRole]).validator((data: unknown) => z.object({ productId: z.string().uuid().optional(), offerGroupId: z.string().uuid().optional(), campaignId: z.string().uuid().optional() }).refine(v => Boolean(v.productId || v.offerGroupId)).parse(data)).handler(async ({ data }) => { const { supabaseAdmin } = await import('@/integrations/supabase/client.server'); let q = supabaseAdmin.from('products').select('*, marketplaces(name)'); q = data.productId ? q.eq('id', data.productId) : q.eq('offer_group_id', data.offerGroupId!).eq('is_best_offer', true); const { data: product, error } = await q.maybeSingle(); if (error) throw error; if (!product) return { error: 'Product not found' }; const p = product as any; const url = String(p.affiliate_url || '').trim(); if (!url) return { error: 'Product has no affiliate URL.' }; return { message: [`🔥 <b>${escapeHtml(String(p.title))}</b>`, '', `💰 De: <s>R$ ${p.previous_price?.toLocaleString('pt-BR') || '---'}</s>`, `✅ <b>Por: R$ ${Number(p.current_price).toLocaleString('pt-BR')}</b>`, `📉 Desconto: ${p.discount ?? 0}% OFF`, '', `📍 Vendido por: ${escapeHtml(String(p.marketplaces?.name || 'Parceiro'))}`, '', `🔗 <a href="${escapeHtml(url)}">Compre aqui</a>`].join('\n') }; });
function escapeHtml(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

export const sendTelegramManual = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({
    operationKey: z.string().uuid(),
    productId: z.string().uuid(),
    message: z.string().trim().min(1).max(4000),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const config = await getConfig(supabaseAdmin);
    const { token, channelId } = await getTelegramCredentials();
    if (!config?.is_active) return { success: false, status: "not_started", error: "Telegram integration not active" };
    if (!token || !channelId) return { success: false, status: "not_started", error: "Telegram Bot Token ou Channel ID não está configurado no Secure Hub." };
    return sendTelegramWithOutbox(supabaseAdmin, {
      operationKey: data.operationKey, productId: data.productId, message: data.message,
      messageKind: "manual", actorId: context.userId,
    }, { token, channelId });
  });