-- Sprint 212: reviewed movement evidence + Owner audit commit or rollback together.
create or replace function public.rubi_record_audience_review_audited(
 p_movement_id uuid,p_expected_revision integer,p_outcome text,
 p_reviewer_note text,p_source_reference text,p_actor uuid
) returns uuid language plpgsql security invoker set search_path=''
as $rubi$
declare
 movement public.rubi_movements%rowtype;
 review_id uuid;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles u where u.user_id=p_actor and u.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_movement_id is null or p_expected_revision is null or p_expected_revision<1
  or p_outcome not in ('needs_more_evidence','document_reviewed')
  or length(btrim(coalesce(p_reviewer_note,''))) not between 20 and 1000
  or length(btrim(coalesce(p_source_reference,''))) not between 12 and 500
 then raise exception 'Invalid review details'; end if;
 select * into movement from public.rubi_movements
  where id=p_movement_id for update;
 if not found then raise exception 'Movement not found'; end if;
 if movement.revision<>p_expected_revision then raise exception 'Movement revision changed'; end if;
 if length(btrim(coalesce(movement.evidence_notes,''))) not between 40 and 1400
 then raise exception 'Evidence must be structured and complete'; end if;
 insert into public.rubi_audience_evidence_reviews(
  movement_id,movement_revision,evidence_snapshot,outcome,reviewer_note,source_reference
 ) values(
  p_movement_id,p_expected_revision,movement.evidence_notes,p_outcome,
  btrim(p_reviewer_note),btrim(p_source_reference)
 ) returning id into review_id;
 -- Do not reproduce private source references, reviewer notes or evidence in log.
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(
  p_actor,null,'RUBI_AUDIENCE_EVIDENCE_REVIEWED','audience_evidence_review',review_id,
  '{}'::jsonb,jsonb_build_object('movement_id',p_movement_id,
   'movement_revision',p_expected_revision,'outcome',p_outcome)
 );
 return review_id;
end;
$rubi$;
revoke all on function public.rubi_record_audience_review_audited(uuid,integer,text,text,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_record_audience_review_audited(uuid,integer,text,text,text,uuid)
 to service_role;
