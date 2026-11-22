-- Sprint 186: repair observed drift between existing orchestration/publishing code and live DB.
-- Restore the single server-managed queue before adding provenance columns.
-- content_id is polymorphic across offer_groups, videos and products.
create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('offer','video','bundle')),
  content_id uuid not null,
  channels text[] not null check (cardinality(channels) > 0 and channels <@ array['telegram']::text[]),
  message_template text,
  scheduled_for timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','processing','published','failed')),
  published_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete restrict
);
alter table public.scheduled_posts enable row level security;
revoke all on table public.scheduled_posts from public, anon, authenticated;
grant all on table public.scheduled_posts to service_role;
create index if not exists idx_scheduled_posts_due
  on public.scheduled_posts(status, scheduled_for) where status='pending';
create index if not exists idx_scheduled_posts_created_by
  on public.scheduled_posts(created_by, created_at desc);

-- Restore only expected schema; no post or campaign is created, published, or paid.
create table if not exists public.strategy_orchestration_videos (
 id uuid primary key default gen_random_uuid(),
 orchestration_id uuid not null references public.strategy_orchestrations(id) on delete cascade,
 video_id uuid not null references public.videos(id) on delete cascade,
 position integer not null default 0 check(position>=0),
 created_at timestamptz not null default now(),
 constraint strategy_orchestration_videos_unique_pair unique(orchestration_id,video_id)
);
create index if not exists idx_strategy_orch_videos_orch
 on public.strategy_orchestration_videos(orchestration_id,position);
alter table public.strategy_orchestration_videos enable row level security;
-- The create/read/update orchestrator RPCs run through the server with service credentials;
-- the browser must never mutate orchestration-to-video associations directly.
revoke all on public.strategy_orchestration_videos from public,anon,authenticated;
grant select,insert,update,delete on public.strategy_orchestration_videos to service_role;

alter table public.scheduled_posts
 add column if not exists campaign_id uuid references public.campaigns(id) on delete set null,
 add column if not exists orchestration_id uuid references public.strategy_orchestrations(id) on delete set null;
create index if not exists idx_scheduled_posts_campaign_status
 on public.scheduled_posts(campaign_id,status,scheduled_for);
create index if not exists idx_scheduled_posts_orchestration_status
 on public.scheduled_posts(orchestration_id,status,scheduled_for);
comment on column public.scheduled_posts.campaign_id is 'Provenance, not proof of external channel delivery';
comment on column public.scheduled_posts.orchestration_id is 'Orchestrator queue provenance, not a paid-conversion event';
