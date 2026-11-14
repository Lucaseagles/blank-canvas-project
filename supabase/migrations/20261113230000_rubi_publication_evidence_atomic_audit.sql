-- RUBI Sprint 180: publication references are unverified claims, not sales or payable commissions.
-- Both changes commit with a sanitized named-Owner audit entry, or roll back together.
create or replace function public.rubi_register_team_publication_audited(
 p_actor uuid,p_assignment uuid,p_membership uuid,p_channel text,
 p_url text,p_published_at timestamptz
) returns table(saved_id uuid)
language plpgsql security invoker set search_path=''
as $$
declare a public.rubi_creator_team_campaign_assignments%rowtype;
 m public.rubi_creator_team_members%rowtype;
 profile_status text;
 historical_status text;
 result_id uuid;
begin
 if p_actor is null or not exists(
   select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner required'; end if;
 if p_channel is null or p_channel not in
  ('instagram','tiktok','youtube','facebook','pinterest','whatsapp','telegram','other')
  or p_url is null or char_length(p_url) not between 12 and 500
  or p_url !~ '^https://[^/@#?[:space:]]+([/?][^#[:space:]]*)?$'
  or p_published_at is null or p_published_at>now()+interval '5 minutes'
 then raise exception 'Invalid publication reference'; end if;
 select * into a from public.rubi_creator_team_campaign_assignments
   where id=p_assignment for share;
 if not found or a.status<>'ready' then raise exception 'Assignment must be ready'; end if;
 select * into m from public.rubi_creator_team_members
   where id=p_membership for share;
 if not found or m.team_id<>a.team_id or m.status<>'active'
   or p_published_at<m.joined_at
 then raise exception 'Active member of the same team required'; end if;
 select p.status into profile_status from public.commercial_profiles p
   where p.id=m.commercial_profile_id and p.audience='partner' for share;
 if not found or profile_status<>'approved' then raise exception 'Partner no longer approved'; end if;
 select e.status into historical_status from public.rubi_creator_team_membership_events e
   where e.membership_id=m.id and e.effective_at<=p_published_at
   order by e.effective_at desc,e.id desc limit 1;
 if not found or historical_status<>'active'
 then raise exception 'Membership not proven active at publication date'; end if;
 insert into public.rubi_creator_team_publication_evidence(
   assignment_id,membership_id,channel,publication_url,published_at
 ) values(p_assignment,p_membership,p_channel,p_url,p_published_at)
 returning id into result_id;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,'RUBI_PUBLICATION_REFERENCE_SUBMITTED',
  'rubi_creator_team_publication_evidence',result_id,'{}'::jsonb,
  jsonb_build_object('review_status','submitted','assignment_id',p_assignment,
  'membership_id',p_membership,'channel',p_channel));
 return query select result_id;
end;
$$;
revoke all on function public.rubi_register_team_publication_audited(uuid,uuid,uuid,text,text,timestamptz)
 from public,anon,authenticated;
grant execute on function public.rubi_register_team_publication_audited(uuid,uuid,uuid,text,text,timestamptz)
 to service_role;

create or replace function public.rubi_review_team_publication_audited(
 p_actor uuid,p_id uuid,p_decision text,p_notes text
) returns table(saved_id uuid,new_status text)
language plpgsql security invoker set search_path=''
as $$
declare prior public.rubi_creator_team_publication_evidence%rowtype;
begin
 if p_actor is null or not exists(
   select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner required'; end if;
 if p_decision is null or p_decision not in ('reviewed','rejected')
  or p_notes is null or char_length(btrim(p_notes)) not between 10 and 1000
 then raise exception 'Invalid publication review'; end if;
 select * into prior from public.rubi_creator_team_publication_evidence
  where id=p_id for update;
 if not found or prior.review_status<>'submitted'
 then raise exception 'Publication not submitted or already reviewed'; end if;
 update public.rubi_creator_team_publication_evidence
  set review_status=p_decision,review_notes=p_notes,
      reviewed_at=now(),updated_at=now()
  where id=p_id;
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,'RUBI_PUBLICATION_REFERENCE_REVIEWED',
   'rubi_creator_team_publication_evidence',p_id,
   jsonb_build_object('review_status',prior.review_status),
   jsonb_build_object('review_status',p_decision,'assignment_id',prior.assignment_id,
    'membership_id',prior.membership_id));
 return query select p_id,p_decision;
end;
$$;
revoke all on function public.rubi_review_team_publication_audited(uuid,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.rubi_review_team_publication_audited(uuid,uuid,text,text)
 to service_role;
