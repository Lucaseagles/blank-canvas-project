import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const endpointSchema = z.string().url().max(4000);
const keySchema = z.string().trim().min(1).max(1000);

export const getPushPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const publicKey = process.env['VAPID_PUBLIC_KEY'];
  if (!publicKey) {
    console.error("VAPID_PUBLIC_KEY not set");
    return null;
  }
  return publicKey;
});

export const subscribeToPush = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ endpoint: endpointSchema, p256dh: keySchema, auth: keySchema }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const userId = (context as any).userId;
    if (!userId) throw new Error("Authenticated user required");
    const { error } = await supabaseAdmin.from('push_subscriptions').upsert({ user_id: userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth }, { onConflict: 'user_id, endpoint' });
    if (error) throw error;
    return { success: true };
  });

export const unsubscribeFromPush = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ endpoint: endpointSchema }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const userId = (context as any).userId;
    if (!userId) throw new Error("Authenticated user required");
    const { error } = await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', data.endpoint);
    if (error) throw error;
    return { success: true };
  });

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ push_enabled: z.boolean().optional(), retention_enabled: z.boolean().optional(), frequency_cap_days: z.coerce.number().int().min(0).max(30).optional() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const userId = (context as any).userId;
    if (!userId) throw new Error("Authenticated user required");
    const { data: current } = await supabaseAdmin.from('notification_preferences').select('push_enabled,retention_enabled,frequency_cap_days').eq('user_id', userId).maybeSingle();
    const { error } = await supabaseAdmin.from('notification_preferences').upsert({ user_id: userId, retention_enabled: data.retention_enabled ?? current?.retention_enabled ?? true, frequency_cap_days: data.frequency_cap_days ?? current?.frequency_cap_days ?? 1, push_enabled: data.push_enabled ?? current?.push_enabled ?? true, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    return { success: true };
  });