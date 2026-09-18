-- Sprint 27: connect scheduled publishing to campaigns/orchestrations without creating a second publishing engine.
alter table public.scheduled_posts
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null,
  add column if not exists orchestration_id uuid references public.strategy_orchestrations(id) on delete set null;

create index if not exists idx_scheduled_posts_campaign_status
  on public.scheduled_posts(campaign_id, status, scheduled_for);

create index if not exists idx_scheduled_posts_orchestration_status
  on public.scheduled_posts(orchestration_id, status, scheduled_for);

comment on column public.scheduled_posts.campaign_id is 'Optional campaign provenance for campaign-wide publishing preparation.';
comment on column public.scheduled_posts.orchestration_id is 'Optional Strategy Orchestrator provenance for prepared publishing queue items.';
