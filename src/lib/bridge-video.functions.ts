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

const platformHosts: Record<string, string[]> = {
  tiktok: ['tiktok.com'],
  shopee: ['shopee.com.br', 'shopee.com', 'shope.ee'],
  ml: ['mercadolivre.com.br', 'mercadolibre.com', 'mercadolivre.com', 'meli.la'],
  youtube: ['youtube.com', 'youtu.be'],
};

function assertPlatformLink(platform: string, link: string) {
  const url = new URL(link);
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || !platformHosts[platform]?.some((host) => hostname === host || hostname.endsWith('.' + host))) {
    throw new Error('O link deve ser HTTPS e pertencer à plataforma selecionada.');
  }
}

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

export const getAdminBridgeProducts = createServerFn({ method: 'GET' })
  .middleware([requireOwnerRole])
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id,title,status')
      .neq('status', 'deleted')
      .order('title', { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const saveBridgeVideo = createServerFn({ method: 'POST' })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => bridgeVideoInput.parse(data))
  .handler(async ({ data, context }) => {
    assertPlatformLink(data.platform, data.link);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: result, error } = await supabaseAdmin.rpc('rubi_manage_bridge_video_audited', {
      p_action: 'save',
      p_id: data.id ?? null,
      p_payload: {
        product_id: data.product_id,
        title: data.title,
        subtitle: data.subtitle ?? null,
        thumbnail: data.thumbnail ?? null,
        platform: data.platform,
        link: data.link,
        is_active: data.is_active,
      },
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    const saved = result as unknown as { id?: string } | null;
    if (!saved?.id) throw new Error('Vídeo de ponte e auditoria não foram registrados.');
    return saved;
  });

export const deleteBridgeVideo = createServerFn({ method: 'POST' })
  .middleware([requireOwnerRole])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: result, error } = await supabaseAdmin.rpc('rubi_manage_bridge_video_audited', {
      p_action: 'delete',
      p_id: data.id,
      p_payload: null,
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    const deleted = result as unknown as { id?: string } | null;
    if (deleted?.id !== data.id) throw new Error('Exclusão e auditoria não foram registradas.');
    return { success: true };
  });
