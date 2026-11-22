-- Sprint 27: connect scheduled publishing to campaigns/orchestrations without creating a second publishing engine.
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

alter table public.scheduled_posts
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null,
  add column if not exists orchestration_id uuid references public.strategy_orchestrations(id) on delete set null;

create index if not exists idx_scheduled_posts_campaign_status
  on public.scheduled_posts(campaign_id, status, scheduled_for);

create index if not exists idx_scheduled_posts_orchestration_status
  on public.scheduled_posts(orchestration_id, status, scheduled_for);

comment on column public.scheduled_posts.campaign_id is 'Optional campaign provenance for campaign-wide publishing preparation.';
comment on column public.scheduled_posts.orchestration_id is 'Optional Strategy Orchestrator provenance for prepared publishing queue items.';
