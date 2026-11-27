\set ON_ERROR_STOP on
begin;
select set_config('rubi.qa.audience_movement_id', :'movement_id', true);
select set_config('rubi.qa.audience_revision', :'movement_revision', true);
select set_config('rubi.qa.master_id', :'master_id', true);
select set_config('rubi.qa.non_owner_id', :'non_owner_id', true);

-- The local disposable database connection owns the test-only trigger.
create function pg_temp.rubi_qa_fail_audience_review_audit()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if new.action_type='RUBI_AUDIENCE_EVIDENCE_REVIEWED' then
  raise exception 'QA forced audit failure';
 end if;
 return new;
end;
$fn$;
create trigger rubi_qa_fail_audience_review_audit
 before insert on public.admin_audit_log
 for each row execute function pg_temp.rubi_qa_fail_audience_review_audit();

set local role service_role;
do $qa$
declare
 movement_id uuid := current_setting('rubi.qa.audience_movement_id')::uuid;
 revision integer := current_setting('rubi.qa.audience_revision')::integer;
 master_id uuid := current_setting('rubi.qa.master_id')::uuid;
 non_owner_id uuid := current_setting('rubi.qa.non_owner_id')::uuid;
 before_count integer;
 after_count integer;
begin
 begin
  perform public.rubi_record_audience_review_audited(
   movement_id,revision,'needs_more_evidence',
   'Tentativa de revisão por perfil sem privilégio.','Fonte de teste não autorizada',non_owner_id
  );
  raise exception 'QA failure: non-owner review unexpectedly succeeded';
 exception when others then
  if sqlerrm='QA failure: non-owner review unexpectedly succeeded' then raise; end if;
  if position('Owner authorization required' in sqlerrm)=0 then raise; end if;
 end;
 begin
  perform public.rubi_record_audience_review_audited(
   movement_id,revision+1,'needs_more_evidence',
   'Tentativa com versão obsoleta deve falhar.','Fonte de teste obsoleta',master_id
  );
  raise exception 'QA failure: stale revision unexpectedly succeeded';
 exception when others then
  if sqlerrm='QA failure: stale revision unexpectedly succeeded' then raise; end if;
  if position('Movement revision changed' in sqlerrm)=0 then raise; end if;
 end;
 select count(*) into before_count from public.rubi_audience_evidence_reviews r
  where r.movement_id=movement_id;
 begin
  perform public.rubi_record_audience_review_audited(
   movement_id,revision,'needs_more_evidence',
   'Falha de auditoria deve reverter toda a revisão.','Fonte de teste para rollback',master_id
  );
  raise exception 'QA failure: review survived forced audit failure';
 exception when others then
  if sqlerrm='QA failure: review survived forced audit failure' then raise; end if;
  if position('QA forced audit failure' in sqlerrm)=0 then raise; end if;
 end;
 select count(*) into after_count from public.rubi_audience_evidence_reviews r
  where r.movement_id=movement_id;
 if after_count<>before_count then
  raise exception 'QA failure: failed audit left a review row behind';
 end if;
 raise notice 'PASS: non-owner denied; stale revision denied; failed audit rolled back review insert.';
end;
$qa$;

reset role;
drop trigger rubi_qa_fail_audience_review_audit on public.admin_audit_log;
set local role service_role;
do $qa$
declare
 movement_id uuid := current_setting('rubi.qa.audience_movement_id')::uuid;
 revision integer := current_setting('rubi.qa.audience_revision')::integer;
 master_id uuid := current_setting('rubi.qa.master_id')::uuid;
 review_id uuid;
begin
 review_id:=public.rubi_record_audience_review_audited(
  movement_id,revision,'document_reviewed',
  'Documento sintético conferido; isto não valida aceitação do mercado.',
  'Fixture local de QA — fonte sintética',master_id
 );
 if review_id is null then raise exception 'QA failure: Owner review did not return an ID'; end if;
 if not exists(select 1 from public.rubi_audience_evidence_reviews r
  where r.id=review_id and r.movement_id=movement_id and r.movement_revision=revision
   and r.outcome='document_reviewed') then
  raise exception 'QA failure: immutable review row not persisted';
 end if;
 if not exists(select 1 from public.admin_audit_log a
  where a.entity_id=review_id and a.action_type='RUBI_AUDIENCE_EVIDENCE_REVIEWED') then
  raise exception 'QA failure: matching audit event not persisted';
 end if;
 begin
  update public.rubi_audience_evidence_reviews set reviewer_note='Tampering with history'
   where id=review_id;
  raise exception 'QA failure: immutable review was updated';
 exception when others then
  if sqlerrm='QA failure: immutable review was updated' then raise; end if;
  if position('append-only' in sqlerrm)=0 and position('permission denied' in sqlerrm)=0 then raise; end if;
 end;
 begin
  delete from public.rubi_audience_evidence_reviews where id=review_id;
  raise exception 'QA failure: immutable review was deleted';
 exception when others then
  if sqlerrm='QA failure: immutable review was deleted' then raise; end if;
  if position('append-only' in sqlerrm)=0 then raise; end if;
 end;
 raise notice 'PASS: Owner review and audit persisted; review history is append-only.';
end;
$qa$;
rollback;
