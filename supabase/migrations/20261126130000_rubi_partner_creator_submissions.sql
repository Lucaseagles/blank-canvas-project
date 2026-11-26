-- Sprint 321: creator submissions from approved consumer-to-partner accounts.
-- Submissions are private and never enter the public feed before Owner review.
create table if not exists public.rubi_partner_creator_submissions (
  id uuid primary key default gen_random_uuid(),
  commercial_profile_id uuid not null references public.commercial_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  caption text not null default '' check (char_length(caption) <= 1200),
  content_source text not null check (content_source in ('native_upload','social_link')),
  storage_path text,
  external_url text,
  source_platform text not null check (source_platform in ('native','tiktok','instagram','youtube','shopee','kwai','shein','mercado_livre')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_notes text check (review_notes is null or char_length(review_notes) <= 500),
  video_id uuid references public.videos(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  constraint rubi_creator_submission_source_check check (
    (content_source='native_upload' and storage_path is not null and external_url is null and source_platform='native')
    or
    (content_source='social_link' and storage_path is null and external_url is not null and source_platform<>'native')
  ),
  constraint rubi_creator_submission_review_check check (
    (status='pending' and reviewed_at is null and reviewed_by is null and video_id is null)
    or
    (status='rejected' and reviewed_at is not null and reviewed_by is not null and video_id is null)
    or
    (status='approved' and reviewed_at is not null and reviewed_by is not null)
  )
);

create index if not exists rubi_creator_submissions_partner_created_idx
  on public.rubi_partner_creator_submissions(commercial_profile_id, submitted_at desc);
create index if not exists rubi_creator_submissions_review_queue_idx
  on public.rubi_partner_creator_submissions(status, submitted_at asc);

alter table public.rubi_partner_creator_submissions enable row level security;
revoke all on public.rubi_partner_creator_submissions from public, anon, authenticated;
grant all on public.rubi_partner_creator_submissions to service_role;

create or replace function public.rubi_review_partner_creator_submission(
  p_actor uuid,
  p_submission_id uuid,
  p_decision text,
  p_review_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  submission public.rubi_partner_creator_submissions%rowtype;
  created_video_id uuid;
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then raise exception 'Owner authorization required'; end if;
  if p_decision is null or p_decision not in ('approve','reject') then raise exception 'Invalid review decision'; end if;
  if char_length(coalesce(p_review_notes,''))>500 then raise exception 'Review note too long'; end if;

  select * into submission
  from public.rubi_partner_creator_submissions
  where id=p_submission_id
  for update;
  if not found then raise exception 'Creator submission not found'; end if;
  if submission.status<>'pending' then raise exception 'Creator submission was already reviewed'; end if;

  if p_decision='approve' then
    insert into public.videos(title,video_url,thumbnail_url,product_id,status,storage_path,external_url,caption)
    values(
      submission.title,
      coalesce(submission.external_url, 'storage://' || submission.storage_path),
      null,null,'draft',submission.storage_path,submission.external_url,
      nullif(submission.caption,'')
    ) returning id into created_video_id;
    update public.rubi_partner_creator_submissions
      set status='approved',review_notes=nullif(btrim(coalesce(p_review_notes,'')), ''),
          video_id=created_video_id,reviewed_at=now(),reviewed_by=p_actor
      where id=p_submission_id;
  else
    update public.rubi_partner_creator_submissions
      set status='rejected',review_notes=nullif(btrim(coalesce(p_review_notes,'')), ''),
          reviewed_at=now(),reviewed_by=p_actor
      where id=p_submission_id;
  end if;

  insert into public.admin_audit_log(actor_user_id,action_type,entity_type,entity_id,previous_value,new_value)
  values(
    p_actor,
    case when p_decision='approve' then 'RUBI_PARTNER_CREATOR_SUBMISSION_APPROVED' else 'RUBI_PARTNER_CREATOR_SUBMISSION_REJECTED' end,
    'partner_creator_submission',p_submission_id::text,
    jsonb_build_object('status','pending'),
    public.sanitize_admin_audit_value(jsonb_build_object(
      'status',case when p_decision='approve' then 'approved' else 'rejected' end,
      'video_id',created_video_id,'review_notes',nullif(btrim(coalesce(p_review_notes,'')), '')
    ))
  );
  return jsonb_build_object('id',p_submission_id,'status',case when p_decision='approve' then 'approved' else 'rejected' end,'video_id',created_video_id);
end;
$function$;

revoke all on function public.rubi_review_partner_creator_submission(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.rubi_review_partner_creator_submission(uuid,uuid,text,text) to service_role;
