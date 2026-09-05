import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireOwnerRole } from '@/lib/auth-guards.server';

export type ExternalVideoPlatform = 'tiktok' | 'shopee_video' | 'mercado_livre_video';

export interface ExternalVideo {
  id: string;
  platform: ExternalVideoPlatform;
  external_url: string;
  thumbnail_url: string | null;
  product_id: string;
  title: string;
  description: string | null;
  platform_icon: string | null;
  is_active: boolean;
  view_count: number;
  click_count: number;
  added_at: string;
  added_by: string | null;
  updated_at: string;
  product?: { id: string; slug: string; title: string; current_price?: number | null } | null;
}

const platformSchema = z.enum(['tiktok', 'shopee_video', 'mercado_livre_video']);
const idSchema = z.string().uuid();
const videoSchema = z.object({
  id: idSchema.optional(),
  platform: platformSchema,
  external_url: z.string().url(),
  thumbnail_url: z.string().url().nullable().optional(),
  product_id: idSchema,
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).nullable().optional(),
  platform_icon: z.string().trim().max(16).nullable().optional(),
  is_active: z.boolean().default(true),
});

export const getExternalVideosByProduct = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: idSchema }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from('external_videos')
      .select('*, product:products(id, slug, title, current_price)')
      .eq('product_id', data.productId)
      .eq('is_active', true)
      .order('added_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as ExternalVideo[];
  });

export const getExternalVideos = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from('external_videos')
      .select('*, product:products(id, slug, title, current_price)')
      .eq('is_active', true)
      .order('added_at', { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return (rows ?? []) as ExternalVideo[];
  });

export const getExternalVideoAdminData = createServerFn({ method: 'GET' })
  .middleware([requireOwnerRole])
  .handler(async ({ context }) => {
    const [videosResult, productsResult] = await Promise.all([
      context.supabase.from('external_videos').select('*').order('added_at', { ascending: false }),
      context.supabase.from('products').select('id, slug, title').order('title', { ascending: true }),
    ]);
    if (videosResult.error) throw new Error(videosResult.error.message);
    if (productsResult.error) throw new Error(productsResult.error.message);
    return { videos: (videosResult.data ?? []) as ExternalVideo[], products: productsResult.data ?? [] };
  });

export const saveExternalVideo = createServerFn({ method: 'POST' })
  .middleware([requireOwnerRole])
  .inputValidator(videoSchema)
  .handler(async ({ data, context }) => {
    const payload = {
      platform: data.platform,
      external_url: data.external_url,
      thumbnail_url: data.thumbnail_url ?? null,
      product_id: data.product_id,
      title: data.title,
      description: data.description ?? null,
      platform_icon: data.platform_icon ?? null,
      is_active: data.is_active,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase.from('external_videos').update(payload).eq('id', data.id).select().single();
      if (error) throw new Error(error.message);
      return row as ExternalVideo;
    }
    const { data: row, error } = await context.supabase.from('external_videos').insert({ ...payload, added_by: context.userId }).select().single();
    if (error) throw new Error(error.message);
    return row as ExternalVideo;
  });

export const deleteExternalVideo = createServerFn({ method: 'POST' })
  .middleware([requireOwnerRole])
  .inputValidator(z.object({ id: idSchema }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('external_videos').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
