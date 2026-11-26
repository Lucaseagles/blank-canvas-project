-- Sprint 333: persist each approved partner's learning progress independently from commercial milestones.
create table if not exists public.hub_partner_academy_progress (
  id uuid primary key default gen_random_uuid(),
  commercial_profile_id uuid not null references public.commercial_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_key text not null check (lesson_key ~ '^(common|affiliate|micro_influencer|influencer|expert):[a-z0-9-]+$'),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hub_partner_academy_progress_profile_lesson_unique unique (commercial_profile_id, lesson_key)
);

create index if not exists hub_partner_academy_progress_user_idx
  on public.hub_partner_academy_progress(user_id, completed_at desc);

alter table public.hub_partner_academy_progress enable row level security;
revoke all on public.hub_partner_academy_progress from public, anon, authenticated;
grant all on public.hub_partner_academy_progress to service_role;
