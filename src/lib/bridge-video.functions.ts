import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireOwnerRole } from './auth-guards.server';

const bridgeVideoInput = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(500).optional().nullable(),
  thumbnail: z.string().url().max(2000).optional().nullable(),
  platform: z.enum(['tiktok', 'shopee', 'ml', 'youtube']),
  link: z.string().url().max(2000),
  is_active: z.boolean().default(true),
});

export const getAdminBridgeVideos = createServerFn({ method: 'GET' })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin
      .from('bridge_videos')
      .select('id,product_id,title,subtitle,thumbnail,platform,link,is_active,created_at,updated_at,products(id,slug,title,current_price,images,status)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const saveBridgeVideo = createServerFn({ method: 'POST' })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => bridgeVideoInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const payload = {
      product_id: data.product_id,
      title: data.title,
      subtitle: data.subtitle || null,
      thumbnail: data.thumbnail || null,
      platform: data.platform,
      link: data.link,
      is_active: data.is_active,
    };
    if (data.id) {
      const { data: row, error } = await supabaseAdmin.from('bridge_videos').update(payload).eq('id', data.id).select('*').single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await supabaseAdmin.from('bridge_videos').insert(payload).select('*').single();
    if (error) throw error;
    return row;
  });

export const deleteBridgeVideo = createServerFn({ method: 'POST' })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('bridge_videos').delete().eq('id', data.id);
    if (error) throw error;
    return { success: true };
  });
