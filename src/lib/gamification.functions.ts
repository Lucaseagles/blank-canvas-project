import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getUserGamificationStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // 1. Get Points and Streak
    const { data: pointsData } = await supabaseAdmin
      .from("user_points")
      .select("points, streak_count")
      .eq("user_id", session.user.id)
      .maybeSingle();

    // 2. Get Badges
    const { data: badges } = await supabaseAdmin
      .from("user_badges")
      .select("earned_at, badges(*)")
      .eq("user_id", session.user.id);

    // 3. Get Missions
    const { data: missions } = await supabaseAdmin
      .from("user_missions")
      .select("progress, completed_at, missions(*)")
      .eq("user_id", session.user.id);

    return {
      points: pointsData?.points || 0,
      streak: pointsData?.streak_count || 0,
      badges: badges?.map(b => ({
        earnedAt: b.earned_at,
        ...((b.badges as any) || {})
      })) || [],
      missions: missions?.map(m => ({
        progress: m.progress,
        completedAt: m.completed_at,
        ...((m.missions as any) || {})
      })) || []
    };
  });

export const getGamificationConfig = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    
    const { data: badges } = await supabaseAdmin.from("badges").select("*");
    const { data: missions } = await supabaseAdmin.from("missions").select("*").eq("is_active", true);
    const { data: pointsConfig } = await supabaseAdmin.from("app_points_config").select("*");

    return {
      badges: badges || [],
      missions: missions || [],
      pointsConfig: pointsConfig || []
    };
  });

export const recordUserActivity = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { success: false };

    await supabaseAdmin.rpc('update_user_streak', { _user_id: session.user.id });
    return { success: true };
  });

