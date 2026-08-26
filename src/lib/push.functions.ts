import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getPushPublicKey = createServerFn({ method: "GET" })
  .handler(async () => {
    const publicKey = process.env['VAPID_PUBLIC_KEY'];
    if (!publicKey) {
      console.error("VAPID_PUBLIC_KEY not set");
      return null;
    }
    return publicKey;
  });

export const subscribeToPush = createServerFn({ method: "POST" })
  .validator((data: { endpoint: string; p256dh: string; auth: string }) => 
    z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string()
    }).parse(data)
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const userId = (context as any).userId;

    const { error } = await supabaseAdmin
      .from('push_subscriptions' as any)
      .upsert({
        user_id: userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth
      }, { onConflict: 'user_id, endpoint' });

    if (error) throw error;
    return { success: true };
  });

export const unsubscribeFromPush = createServerFn({ method: "POST" })
  .validator((data: { endpoint: string }) => z.object({ endpoint: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const userId = (context as any).userId;

    const { error } = await supabaseAdmin
      .from('push_subscriptions' as any)
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', data.endpoint);

    if (error) throw error;
    return { success: true };
  });

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .validator((data: { push_enabled?: boolean; retention_enabled?: boolean; frequency_cap_days?: number }) => 
    z.object({
      push_enabled: z.boolean().optional(),
      retention_enabled: z.boolean().optional(),
      frequency_cap_days: z.number().optional()
    }).parse(data)
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const userId = (context as any).userId;

    const { error } = await supabaseAdmin
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        retention_enabled: data.retention_enabled ?? true,
        frequency_cap_days: data.frequency_cap_days ?? 1,
        push_enabled: data.push_enabled ?? true,
        updated_at: new Date().toISOString()
      } as any, { onConflict: 'user_id' });

    if (error) throw error;
    return { success: true };
  });
