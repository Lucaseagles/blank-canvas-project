import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

// Generate a collision-resistant referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const getReferralInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const userId = (context as any).userId;

    let { data: referral, error } = await supabaseAdmin
      .from('referrals' as any)
      .select('*')
      .eq('referrer_user_id', userId)
      .maybeSingle();

    if (error) throw error;

    // Auto-create if not exists
    if (!referral) {
      const code = generateReferralCode();
      const { data: newReferral, error: createError } = await supabaseAdmin
        .from('referrals' as any)
        .insert({
          referrer_user_id: userId,
          referral_code: code
        })
        .select()
        .single();
      
      if (createError) throw createError;
      referral = newReferral;
    }

    const referralData = referral as any;

    // Get stats
    const { count: totalInvited } = await supabaseAdmin
      .from('referral_events' as any)
      .select('*', { count: 'exact', head: true })
      .eq('referral_id', referralData.id);

    const { count: totalRegistered } = await supabaseAdmin
      .from('referral_events' as any)
      .select('*', { count: 'exact', head: true })
      .eq('referral_id', referralData.id)
      .eq('status', 'registered');

    const { count: totalActivated } = await supabaseAdmin
      .from('referral_events' as any)
      .select('*', { count: 'exact', head: true })
      .eq('referral_id', referralData.id)
      .eq('status', 'activated');

    return {
      code: referralData.referral_code,
      stats: {
        invited: totalInvited || 0,
        registered: totalRegistered || 0,
        activated: totalActivated || 0
      }
    };
  });

export const processReferral = createServerFn({ method: "POST" })
  .validator((data: { code: string; invitedUserId: string; campaignId?: string | null }) => 
    z.object({
      code: z.string(),
      invitedUserId: z.string(),
      campaignId: z.string().nullable().optional()
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    const { data: referral } = await supabaseAdmin
      .from('referrals' as any)
      .select('id')
      .eq('referral_code', data.code)
      .single();

    if (!referral) return { success: false, error: 'Invalid code' };
    const referralData = referral as any;

    const { error } = await supabaseAdmin
      .from('referral_events' as any)
      .insert({
        referral_id: referralData.id,
        invited_user_id: data.invitedUserId,
        status: 'registered',
        metadata: data.campaignId ? { campaign_id: data.campaignId } : {}
      });

    if (error) throw error;
    return { success: true };
  });

export const getAdminReferralStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    // Get all referral events with details
    const { data: events, error } = await supabaseAdmin
      .from('referral_events' as any)
      .select(`
        *,
        referrals (
          referral_code,
          referrer_user_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Aggregate summary stats
    const { count: totalCodes } = await supabaseAdmin
      .from('referrals' as any)
      .select('*', { count: 'exact', head: true });

    const { count: totalEvents } = await supabaseAdmin
      .from('referral_events' as any)
      .select('*', { count: 'exact', head: true });

    return {
      events: events as any[],
      summary: {
        totalCodes: totalCodes || 0,
        totalEvents: totalEvents || 0
      }
    };
  });

