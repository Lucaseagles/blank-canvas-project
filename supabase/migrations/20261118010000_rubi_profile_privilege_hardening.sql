-- Sprint 234: least-privilege grants for self-service profiles.
-- RLS remains the row-level boundary; SQL grants now enforce the intended
-- operation/column boundary before RLS is evaluated.

-- profiles: no anonymous access, no client inserts/deletes, and no self-service
-- updates to role, ban state, referral counters, ownership, or tier assignment.
revoke all privileges on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (
  display_name,
  location_city,
  location_state,
  whatsapp_opt_in,
  whatsapp_opt_in_at,
  whatsapp_opt_in_source,
  show_on_leaderboard,
  updated_at
) on table public.profiles to authenticated;

-- user_preferences: authenticated users can read/create/update their own row
-- under the existing ownership RLS policy, but cannot delete it. No anon access.
revoke all privileges on table public.user_preferences from public, anon, authenticated;
grant select, insert, update on table public.user_preferences to authenticated;

-- service_role grants are intentionally preserved for trusted server-side flows.
