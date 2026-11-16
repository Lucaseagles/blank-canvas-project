-- Sprint 209: mandatory Owner audit and QA checklist upsert in one transaction.
-- A checked item is a human attestation, never proof of an actual payment.
create or replace function public.rubi_save_launch_qa_audited(
 p_product_id uuid,p_checklist jsonb,p_commercial_snapshot text,p_actor uuid
) returns uuid language plpgsql security invoker set search_path=''
as $rubi$
declare
 old_row public.rubi_launch_qa_checklists%rowtype;
 qa_key text;
 s text;
 evidence text;
 vals jsonb:='{}'::jsonb;
 states jsonb:='{}'::jsonb;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles u where u.user_id=p_actor and u.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if p_product_id is null or jsonb_typeof(p_checklist)<>'object' then
  raise exception 'Invalid launch QA data'; end if;
 if p_commercial_snapshot is null or length(p_commercial_snapshot)<8
   or length(p_commercial_snapshot)>5000 then raise exception 'Invalid commercial snapshot'; end if;
 -- Refuse a dangling checklist; transaction waits on the target product row.
 perform 1 from public.hub_products p where p.id=p_product_id for share;
 if not found then raise exception 'Approved product record is required'; end if;
 foreach qa_key in array array['domain','desktop','mobile','supplier','terms'] loop
  if jsonb_typeof(p_checklist->qa_key)<>'object' then
   raise exception 'Missing QA item: %',qa_key; end if;
  s:=p_checklist->qa_key->>'status';
  evidence:=btrim(coalesce(p_checklist->qa_key->>'evidence',''));
  if s is null or s not in ('pending','verified','blocked') or length(evidence)>1000
    or (s='verified' and length(evidence)<8) then
   raise exception 'Invalid QA evidence/status: %',qa_key; end if;
  vals:=vals||jsonb_build_object(qa_key||'_status',s,qa_key||'_evidence',evidence);
  states:=states||jsonb_build_object(qa_key,s);
 end loop;
 -- Row lock ensures old -> new history is serialized and durable.
 select * into old_row from public.rubi_launch_qa_checklists
   where product_id=p_product_id for update;
 insert into public.rubi_launch_qa_checklists(
  product_id,domain_status,domain_evidence,desktop_status,desktop_evidence,
  mobile_status,mobile_evidence,supplier_status,supplier_evidence,
  terms_status,terms_evidence,commercial_snapshot,updated_at
 ) values (
  p_product_id,vals->>'domain_status',vals->>'domain_evidence',
  vals->>'desktop_status',vals->>'desktop_evidence',
  vals->>'mobile_status',vals->>'mobile_evidence',
  vals->>'supplier_status',vals->>'supplier_evidence',
  vals->>'terms_status',vals->>'terms_evidence',
  p_commercial_snapshot,now()
 ) on conflict(product_id) do update set
  domain_status=excluded.domain_status,domain_evidence=excluded.domain_evidence,
  desktop_status=excluded.desktop_status,desktop_evidence=excluded.desktop_evidence,
  mobile_status=excluded.mobile_status,mobile_evidence=excluded.mobile_evidence,
  supplier_status=excluded.supplier_status,supplier_evidence=excluded.supplier_evidence,
  terms_status=excluded.terms_status,terms_evidence=excluded.terms_evidence,
  commercial_snapshot=excluded.commercial_snapshot,updated_at=now();
 -- Audit contains status only, avoiding inclusion of evidence or confidential URLs.
 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
 ) values(p_actor,null,'RUBI_LAUNCH_QA_SAVED','launch_qa',p_product_id,
  case when old_row.product_id is null then '{}'::jsonb else
   jsonb_build_object('domain',old_row.domain_status,
     'desktop',old_row.desktop_status,'mobile',old_row.mobile_status,
     'supplier',old_row.supplier_status,'terms',old_row.terms_status) end,
  states
 );
 return p_product_id;
end;
$rubi$;
revoke all on function public.rubi_save_launch_qa_audited(uuid,jsonb,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_save_launch_qa_audited(uuid,jsonb,text,uuid)
 to service_role;
