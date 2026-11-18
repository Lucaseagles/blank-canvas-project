-- Sprint 243: scheduled video launch, Telegram queue insertion and audit are one transaction.
create or replace function public.rubi_process_due_video_launch_audited(
  p_video_id uuid,
  p_actor uuid
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $function$
declare
  old_video public.videos%rowtype;
  v_channels text[] := array[]::text[];
  v_unsupported text[] := array[]::text[];
  v_telegram_enabled boolean := false;
  v_post_id uuid;
  v_now timestamptz := now();
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
  ) then
    raise exception 'Owner authorization required';
  end if;
  if p_video_id is null then raise exception 'Video ID required'; end if;

  select * into old_video
  from public.videos
  where id=p_video_id
  for update;

  if not found then raise exception 'Video not found'; end if;
  if old_video.status <> 'draft' then
    return jsonb_build_object('status','already_processed','queued',false,'already_queued',false,'unsupported_channels','[]'::jsonb);
  end if;
  if old_video.scheduled_for is null or old_video.scheduled_for > v_now then
    return jsonb_build_object('status','not_due','queued',false,'already_queued',false,'unsupported_channels','[]'::jsonb);
  end if;

  if old_video.campaign_id is not null then
    select coalesce(array_agg(distinct cc.channel order by cc.channel),array[]::text[])
      into v_channels
    from public.campaign_channels cc
    where cc.campaign_id=old_video.campaign_id and cc.is_enabled=true;
  end if;

  v_telegram_enabled := 'telegram'=any(v_channels);
  select coalesce(array_agg(channel order by channel),array[]::text[])
    into v_unsupported
  from unnest(v_channels) as channel
  where channel <> 'telegram';

  update public.videos
  set status='published'
  where id=p_video_id;

  insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,null,'RUBI_VIDEO_LAUNCH_PUBLISHED','video',p_video_id,
    jsonb_build_object('status',old_video.status,'scheduled_for',old_video.scheduled_for),
    jsonb_build_object('status','published','campaign_id',old_video.campaign_id)
  );

  if v_telegram_enabled then
    select sp.id into v_post_id
    from public.scheduled_posts sp
    where sp.content_type='video'
      and sp.content_id=p_video_id
      and sp.channels @> array['telegram']::text[]
      and sp.status in ('pending','processing','published')
    order by sp.created_at desc
    limit 1
    for update;

    if v_post_id is null then
      insert into public.scheduled_posts(
        content_type,content_id,channels,scheduled_for,status,message_template,created_by,campaign_id
      ) values (
        'video',p_video_id,array['telegram']::text[],v_now,'pending',
        left('Novo vídeo: ' || coalesce(nullif(btrim(old_video.title),''),'Novo vídeo disponível.'),4000),
        p_actor,old_video.campaign_id
      ) returning id into v_post_id;

      insert into public.admin_audit_log(
        actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
      ) values (
        p_actor,null,'RUBI_VIDEO_LAUNCH_QUEUED','scheduled_post',v_post_id,'{}'::jsonb,
        jsonb_build_object('status','pending','content_type','video','content_id',p_video_id,
          'channels',jsonb_build_array('telegram'),'campaign_id',old_video.campaign_id)
      );
      return jsonb_build_object('status','published','queued',true,'already_queued',false,
        'unsupported_channels',to_jsonb(v_unsupported));
    end if;

    return jsonb_build_object('status','published','queued',false,'already_queued',true,
      'unsupported_channels',to_jsonb(v_unsupported));
  end if;

  return jsonb_build_object('status','published','queued',false,'already_queued',false,
    'unsupported_channels',to_jsonb(v_unsupported));
end;
$function$;

revoke all on function public.rubi_process_due_video_launch_audited(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.rubi_process_due_video_launch_audited(uuid,uuid)
  to service_role;
