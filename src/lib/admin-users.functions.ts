import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "@/lib/auth-guards.server";

export type AdminUserRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  created_at: string | null;
  total_referrals: number;
  current_tier_id: string | null;
  is_banned: boolean;
};

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data: { limit?: number; offset?: number; search?: string | null; banned?: boolean | null }) => data)
  .handler(async ({ data }): Promise<{ rows: AdminUserRow[]; count: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const params = {
      p_limit: data.limit ?? 25,
      p_offset: data.offset ?? 0,
      p_search: data.search ?? null,
      p_banned: data.banned ?? null,
    };
    const [rows, count] = await Promise.all([
      db.rpc("admin_list_users", params),
      db.rpc("admin_count_users", { p_search: params.p_search, p_banned: params.p_banned }),
    ]);
    if (rows.error) throw new Error(rows.error.message);
    if (count.error) throw new Error(count.error.message);
    return { rows: (rows.data ?? []) as AdminUserRow[], count: Number(count.data ?? 0) };
  });

export const setUserBanned = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data: { userId: string; banned: boolean }) => data)
  .handler(async ({ data, context }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ok, error } = await (supabaseAdmin as any).rpc("admin_set_profile_banned", {
      p_user_id: data.userId,
      p_banned: data.banned,
      p_actor: context.userId,
    });
    if (error) throw new Error(error.message);
    return Boolean(ok);
  });
