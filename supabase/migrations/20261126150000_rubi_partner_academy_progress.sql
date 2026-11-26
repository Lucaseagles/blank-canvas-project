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

-- The table is intentionally not exposed through PostgREST. Only these narrowly scoped
-- RPCs are callable by service_role after the application verifies the user's access token.
create or replace function public.rubi_get_partner_academy_progress(p_actor uuid)
returns table(lesson_key text)
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_profile_id uuid;
  v_partner_type text;
begin
  if p_actor is null then raise exception 'Partner identity required'; end if;
  select cp.id, cp.partner_type into v_profile_id, v_partner_type
  from public.commercial_profiles cp
  where cp.user_id=p_actor and cp.audience='partner' and cp.status='approved';
  if not found then raise exception 'Approved partner required'; end if;

  return query
  select progress.lesson_key
  from public.hub_partner_academy_progress progress
  where progress.commercial_profile_id=v_profile_id
    and progress.user_id=p_actor
    and (
      progress.lesson_key in (
        'common:foundations','common:product-offer','common:content',
        'common:distribution','common:backstage','common:network'
      )
      or (v_partner_type='affiliate' and progress.lesson_key='affiliate:catalog-to-sale')
      or (v_partner_type='micro_influencer' and progress.lesson_key='micro_influencer:community')
      or (v_partner_type='influencer' and progress.lesson_key='influencer:campaigns')
      or (v_partner_type='expert' and progress.lesson_key='expert:authority')
    )
  order by progress.completed_at asc;
end;
$function$;

create or replace function public.rubi_set_partner_academy_lesson_completion(
  p_actor uuid,
  p_lesson_key text,
  p_completed boolean
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_profile_id uuid;
  v_partner_type text;
begin
  if p_actor is null then raise exception 'Partner identity required'; end if;
  if p_lesson_key is null or p_completed is null then raise exception 'Lesson and completion state required'; end if;
  select cp.id, cp.partner_type into v_profile_id, v_partner_type
  from public.commercial_profiles cp
  where cp.user_id=p_actor and cp.audience='partner' and cp.status='approved';
  if not found then raise exception 'Approved partner required'; end if;

  if p_lesson_key not in (
    'common:foundations','common:product-offer','common:content',
    'common:distribution','common:backstage','common:network'
  )
  and not (v_partner_type='affiliate' and p_lesson_key='affiliate:catalog-to-sale')
  and not (v_partner_type='micro_influencer' and p_lesson_key='micro_influencer:community')
  and not (v_partner_type='influencer' and p_lesson_key='influencer:campaigns')
  and not (v_partner_type='expert' and p_lesson_key='expert:authority') then
    raise exception 'Lesson is not available for this partner profile';
  end if;

  if p_completed then
    insert into public.hub_partner_academy_progress(
      commercial_profile_id,user_id,lesson_key,completed_at,updated_at
    ) values (v_profile_id,p_actor,p_lesson_key,now(),now())
    on conflict (commercial_profile_id,lesson_key)
    do update set completed_at=excluded.completed_at,updated_at=now();
  else
    delete from public.hub_partner_academy_progress
    where commercial_profile_id=v_profile_id and user_id=p_actor and lesson_key=p_lesson_key;
  end if;

  return jsonb_build_object('lesson_key',p_lesson_key,'completed',p_completed);
end;
$function$;

revoke all on function public.rubi_get_partner_academy_progress(uuid) from public, anon, authenticated;
revoke all on function public.rubi_set_partner_academy_lesson_completion(uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.rubi_get_partner_academy_progress(uuid) to service_role;
grant execute on function public.rubi_set_partner_academy_lesson_completion(uuid,text,boolean) to service_role;
