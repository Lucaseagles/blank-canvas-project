import { createServerFn } from "@tanstack/react-start";
import { requireOwnerRole } from "@/lib/auth-guards.server";
import { z } from "zod";

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

const ListSchema = z.object({
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).max(1_000_000).default(0),
  search: z.string().trim().max(200).nullable().optional(),
  banned: z.boolean().nullable().optional(),
});

const BanSchema = z.object({ userId: z.string().uuid(), banned: z.boolean() });

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireOwnerRole])
  .inputValidator((data: unknown) => ListSchema.parse(data))
  .handler(async ({ data }): Promise<{ rows: AdminUserRow[]; count: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const params = {
      p_limit: data.limit,
      p_offset: data.offset,
      p_search: data.search || null,
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
  .inputValidator((data: unknown) => BanSchema.parse(data))
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
