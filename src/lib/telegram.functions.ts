import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getTelegramConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin
      .from('telegram_config' as any)
      .select('*')
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    const config = data as any;
    
    // Don't return the real secret ref to client, just its existence
    return {
      id: config.id,
      channel_id: config.channel_id,
      is_active: config.is_active,
      hasToken: !!config.bot_token_secret_ref
    };
  });

export const saveTelegramConfig = createServerFn({ method: "POST" })
  .validator((data: { channelId: string; isActive: boolean; botToken?: string | null }) => 
    z.object({
      channelId: z.string(),
      isActive: z.boolean(),
      botToken: z.string().nullable().optional()
    }).parse(data)
  )

  .middleware([requireSupabaseAuth])
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    const configData: any = {
      channel_id: data.channelId,
      is_active: data.isActive,
      updated_at: new Date().toISOString()
    };
    
    if (data.botToken) {
      configData.bot_token_secret_ref = 'vault_ref_' + Math.random().toString(36).substring(7);
    }

    const { error } = await supabaseAdmin
      .from('telegram_config' as any)
      .upsert(configData, { onConflict: 'id' as any });

    if (error) throw error;
    return { success: true };
  });

export const composeTelegramMessage = createServerFn({ method: "POST" })
  .validator((data: { productId?: string; offerGroupId?: string; campaignId?: string }) => 
    z.object({
      productId: z.string().optional(),
      offerGroupId: z.string().optional(),
      campaignId: z.string().optional()
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    let product;
    if (data.productId) {
      const { data: p } = await supabaseAdmin
        .from('products')
        .select('*, marketplaces(name)')
        .eq('id', data.productId)
        .single();
      product = p as any;
    } else if (data.offerGroupId) {
      const { data: p } = await supabaseAdmin
        .from('products')
        .select('*, marketplaces(name)')
        .eq('offer_group_id', data.offerGroupId)
        .eq('is_best_offer', true)
        .single();
      product = p as any;
    }

    if (!product) return { error: 'Product not found' };

    const message = `
🔥 *${product.title.toUpperCase()}*

💰 De: ~R$ ${product.previous_price?.toLocaleString('pt-BR') || '---'}~
✅ *Por: R$ ${product.current_price.toLocaleString('pt-BR')}*
📉 Desconto: ${product.discount}% OFF

📍 Vendido por: ${product.marketplaces?.name || 'Parceiro'}

🔗 Compre aqui: ${product.affiliate_url}${product.affiliate_url?.includes('?') ? '&' : '?'}utm_source=telegram${data.campaignId ? `&campaign_id=${data.campaignId}` : ''}
    `.trim();

    return { message };
  });

export const sendTelegramManual = createServerFn({ method: "POST" })
  .validator((data: { productId: string; message: string }) => 
    z.object({
      productId: z.string(),
      message: z.string()
    }).parse(data)
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    const { data: configData } = await supabaseAdmin
      .from('telegram_config' as any)
      .select('*')
      .maybeSingle();

    const config = configData as any;
    if (!config || !config.is_active) {
      return { success: false, error: 'Telegram integration not active' };
    }

    // In a real app, this is where we'd call the Telegram API using the token from vault
    console.log('TELEGRAM BROADCAST SIMULATED:', data.message);

    const { error } = await supabaseAdmin
      .from('telegram_messages' as any)
      .insert({
        product_id: data.productId,
        message_text: data.message,
        status: 'sent', // For simulation
        sent_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true };
  });
