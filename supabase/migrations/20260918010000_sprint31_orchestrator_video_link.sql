create table if not exists public.strategy_orchestration_videos (
  id uuid primary key default gen_random_uuid(),
  orchestration_id uuid not null references public.strategy_orchestrations(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique(orchestration_id, video_id)
);

create index if not exists idx_strategy_orch_videos_orch
  on public.strategy_orchestration_videos(orchestration_id, position);

alter table public.strategy_orchestration_videos enable row level security;

drop policy if exists strategy_orch_videos_owner_all on public.strategy_orchestration_videos;
create policy strategy_orch_videos_owner_all
  on public.strategy_orchestration_videos
  for all to authenticated
  using (has_role((select auth.uid()), 'owner'::app_role))
  with check (has_role((select auth.uid()), 'owner'::app_role));

revoke all on public.strategy_orchestration_videos from public, anon;
grant select, insert, update, delete on public.strategy_orchestration_videos to authenticated;

create or replace function public.create_strategy_orchestration(
  p_name text,
  p_objective text,
  p_priority integer,
  p_notes text,
  p_strategy_ids uuid[],
  p_video_ids uuid[] default '{}'::uuid[]
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  if not has_role((select auth.uid()), 'owner'::app_role) then raise exception 'owner access required'; end if;
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 160 then raise exception 'invalid name'; end if;
  if p_objective not in ('traffic','engagement','followers','conversion','awareness') then raise exception 'invalid objective'; end if;

  insert into public.strategy_orchestrations(name, objective, priority, notes, created_by)
  values(trim(p_name), p_objective, greatest(0, least(100, coalesce(p_priority,50))), nullif(trim(p_notes),''), (select auth.uid()))
  returning id into v_id;

  insert into public.strategy_orchestration_items(orchestration_id, strategy_id, position)
  select v_id, x.strategy_id, x.position
  from unnest(coalesce(p_strategy_ids, '{}'::uuid[])) with ordinality as x(strategy_id, position)
  join public.social_channel_strategies s on s.id = x.strategy_id and s.is_active = true;

  insert into public.strategy_orchestration_videos(orchestration_id, video_id, position)
  select v_id, x.video_id, x.position
  from unnest(coalesce(p_video_ids, '{}'::uuid[])) with ordinality as x(video_id, position)
  join public.videos v on v.id = x.video_id;

  return v_id;
end;
$$;

revoke all on function public.create_strategy_orchestration(text,text,integer,text,uuid[]) from public, anon, authenticated;
revoke all on function public.create_strategy_orchestration(text,text,integer,text,uuid[],uuid[]) from public, anon;
grant execute on function public.create_strategy_orchestration(text,text,integer,text,uuid[],uuid[]) to authenticated;

create or replace function public.generate_strategy_orchestration_plan(p_orchestration_id uuid)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare result jsonb;
begin
  if not has_role((select auth.uid()), 'owner'::app_role) then raise exception 'owner access required'; end if;

  with selected as (
    select s.id, s.name, s.objective, s.posting_frequency_per_week, s.cta,
           s.content_pillars, s.preferred_formats, s.priority, s.audience_segment,
           ch.id as channel_id, ch.channel_name, ch.platform,
           c.name as category_name, cc.title as collection_title, ca.name as campaign_name
    from public.strategy_orchestration_items oi
    join public.social_channel_strategies s on s.id = oi.strategy_id
    join public.social_channels ch on ch.id = s.channel_id
    left join public.categories c on c.id = s.category_id
    left join public.curated_collections cc on cc.id = s.collection_id
    left join public.campaigns ca on ca.id = s.campaign_id
    where oi.orchestration_id = p_orchestration_id and s.is_active = true
    order by oi.position, s.priority desc
  ),
  selected_videos as (
    select v.id, v.title, v.video_url, v.external_url, v.thumbnail_url, v.platform
    from public.strategy_orchestration_videos ov
    join public.videos v on v.id = ov.video_id
    where ov.orchestration_id = p_orchestration_id
    order by ov.position
  )
  select jsonb_build_object(
    'generated_at', now(),
    'strategy_count', (select count(*) from selected),
    'video_count', (select count(*) from selected_videos),
    'channels', coalesce((select jsonb_agg(distinct jsonb_build_object('id',channel_id,'platform',platform,'name',channel_name)) from selected where channel_id is not null), '[]'::jsonb),
    'strategies', coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'objective',objective,'channel',channel_name,'platform',platform,'category',category_name,'collection',collection_title,'campaign',campaign_name,'segment',audience_segment,'frequency_per_week',posting_frequency_per_week,'content_pillars',content_pillars,'preferred_formats',preferred_formats,'cta',cta,'priority',priority)) from selected), '[]'::jsonb),
    'videos', coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'video_url',video_url,'external_url',external_url,'thumbnail_url',thumbnail_url,'platform',platform)) from selected_videos), '[]'::jsonb),
    'execution', jsonb_build_object(
      'publishing','Use existing scheduled_posts / publishing engine',
      'campaigns','Use linked existing campaigns',
      'automation','Use existing automation_rules; no new automation engine',
      'approval_required',true
    )
  ) into result;

  update public.strategy_orchestrations
  set plan = result,
      status = case when jsonb_array_length(result->'strategies') > 0 then 'ready' else 'draft' end,
      updated_at = now()
  where id = p_orchestration_id;

  return result;
end;
$$;

revoke all on function public.generate_strategy_orchestration_plan(uuid) from public, anon;
grant execute on function public.generate_strategy_orchestration_plan(uuid) to authenticated;
