-- Sprint 253: atomic allocations and ledger-only reversals.
-- Provider-side refunds/reversals remain separate external operations and must be evidenced independently.

alter table public.rubi_finance_allocations
  add column allocation_kind text not null default 'settlement'
    check (allocation_kind in ('settlement','reversal')),
  add column reverses_allocation_id uuid
    references public.rubi_finance_allocations(id) on delete restrict,
  add column created_by uuid references auth.users(id) on delete set null,
  add constraint rubi_finance_allocations_reversal_shape_check
    check (
      (allocation_kind='settlement' and reverses_allocation_id is null)
      or
      (allocation_kind='reversal' and reverses_allocation_id is not null)
    );

create unique index rubi_finance_allocations_single_reversal_uidx
  on public.rubi_finance_allocations(reverses_allocation_id)
  where reverses_allocation_id is not null;

create or replace function public.rubi_finance_allocate_entry(
  p_entry_id uuid,
  p_obligation_id uuid,
  p_amount numeric,
  p_actor uuid,
  p_note text default null
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_entry public.rubi_finance_entries%rowtype;
  v_obligation public.rubi_finance_obligations%rowtype;
  v_entry_allocated numeric(18,2);
  v_obligation_settled numeric(18,2);
  v_allocation_id uuid;
  v_actor_email text;
  v_expected_direction text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required';
  end if;
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role::text='owner'
  ) then raise exception 'Owner authorization required'; end if;
  if p_entry_id is null or p_obligation_id is null then
    raise exception 'Entry and obligation are required';
  end if;
  if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) then
    raise exception 'Allocation must be positive with at most two decimal places';
  end if;
  if p_note is not null and length(p_note)>500 then raise exception 'Note is too long'; end if;

  -- Lock in a consistent order: entry first, then obligation.
  select * into v_entry
  from public.rubi_finance_entries
  where id=p_entry_id
  for update;
  if not found then raise exception 'Financial entry not found'; end if;
  if v_entry.reversal_of_entry_id is not null then
    raise exception 'A reversal entry cannot be allocated as a new settlement';
  end if;
  if exists (
    select 1 from public.rubi_finance_entries r where r.reversal_of_entry_id=v_entry.id
  ) then raise exception 'A reversed entry cannot receive new allocations'; end if;

  select * into v_obligation
  from public.rubi_finance_obligations
  where id=p_obligation_id
  for update;
  if not found then raise exception 'Financial obligation not found'; end if;
  if v_obligation.status in ('settled','cancelled','disputed') then
    raise exception 'Financial obligation is not open for settlement';
  end if;
  if v_entry.currency<>v_obligation.currency then
    raise exception 'Entry and obligation currencies do not match';
  end if;

  v_expected_direction := case when v_obligation.obligation_type='receivable' then 'inflow' else 'outflow' end;
  if v_entry.direction<>v_expected_direction then
    raise exception 'Entry direction does not match obligation type';
  end if;

  select coalesce(sum(case when a.allocation_kind='settlement'
    then a.allocated_amount else -a.allocated_amount end),0)
    into v_entry_allocated
  from public.rubi_finance_allocations a
  where a.entry_id=v_entry.id;

  select coalesce(sum(case when a.allocation_kind='settlement'
    then a.allocated_amount else -a.allocated_amount end),0)
    into v_obligation_settled
  from public.rubi_finance_allocations a
  where a.obligation_id=v_obligation.id;

  if v_entry_allocated<0 or v_entry_allocated+p_amount>v_entry.amount then
    raise exception 'Allocation exceeds unallocated entry balance';
  end if;
  if v_obligation_settled<0 or v_obligation_settled+p_amount>v_obligation.expected_amount then
    raise exception 'Allocation exceeds outstanding obligation balance';
  end if;

  insert into public.rubi_finance_allocations(
    entry_id,obligation_id,allocated_amount,allocation_kind,created_by
  ) values (
    v_entry.id,v_obligation.id,p_amount,'settlement',p_actor
  ) returning id into v_allocation_id;

  v_obligation_settled:=v_obligation_settled+p_amount;
  update public.rubi_finance_obligations
  set status=case
    when v_obligation_settled>=expected_amount then 'settled'
    else 'partially_settled'
  end,
  updated_at=now()
  where id=v_obligation.id;

  select u.email into v_actor_email from auth.users u where u.id=p_actor;
  insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,v_actor_email,'RUBI_FINANCE_ALLOCATION_CREATED','finance_allocation',v_allocation_id,
    jsonb_build_object('obligation_status',v_obligation.status,'settled_before',v_obligation_settled-p_amount),
    jsonb_build_object(
      'entry_id',v_entry.id,'obligation_id',v_obligation.id,'amount',p_amount,
      'currency',v_entry.currency,'settled_after',v_obligation_settled,
      'note',p_note
    )
  );
  return v_allocation_id;
end;
$$;

create or replace function public.rubi_finance_reverse_entry(
  p_entry_id uuid,
  p_effective_at timestamptz,
  p_reason text,
  p_actor uuid
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_original public.rubi_finance_entries%rowtype;
  v_reversal_id uuid;
  v_actor_email text;
  v_allocation record;
  v_net numeric(18,2);
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required';
  end if;
  if p_actor is null or not exists (
    select 1 from public.user_roles r where r.user_id=p_actor and r.role::text='owner'
  ) then raise exception 'Owner authorization required'; end if;
  if p_entry_id is null or p_effective_at is null or p_effective_at>now() then
    raise exception 'Valid entry and reversal date are required';
  end if;
  if p_reason is null or length(btrim(p_reason))<8 or length(p_reason)>500 then
    raise exception 'A reversal reason of 8 to 500 characters is required';
  end if;

  select * into v_original
  from public.rubi_finance_entries
  where id=p_entry_id
  for update;
  if not found then raise exception 'Financial entry not found'; end if;
  if v_original.reversal_of_entry_id is not null then
    raise exception 'A reversal cannot itself be reversed';
  end if;
  if exists (
    select 1 from public.rubi_finance_entries r where r.reversal_of_entry_id=v_original.id
  ) then raise exception 'Financial entry was already reversed'; end if;

  insert into public.rubi_finance_entries(
    entry_type,direction,amount,currency,effective_at,source_kind,source_id,
    provider_id,external_reference,partner_profile_id,document_id,
    verification_method,verification_reference,reversal_of_entry_id,created_by,safe_metadata
  ) values (
    v_original.entry_type,
    case when v_original.direction='inflow' then 'outflow' else 'inflow' end,
    v_original.amount,v_original.currency,p_effective_at,'internal',v_original.id::text,
    v_original.provider_id,null,v_original.partner_profile_id,v_original.document_id,
    'internal',btrim(p_reason),v_original.id,p_actor,
    jsonb_build_object('ledger_only_reversal',true,'reason',btrim(p_reason))
  ) returning id into v_reversal_id;

  for v_allocation in
    select a.id,a.obligation_id,a.allocated_amount
    from public.rubi_finance_allocations a
    where a.entry_id=v_original.id and a.allocation_kind='settlement'
    order by a.obligation_id
  loop
    perform 1 from public.rubi_finance_obligations o
    where o.id=v_allocation.obligation_id
    for update;

    insert into public.rubi_finance_allocations(
      entry_id,obligation_id,allocated_amount,allocation_kind,reverses_allocation_id,created_by
    ) values (
      v_reversal_id,v_allocation.obligation_id,v_allocation.allocated_amount,
      'reversal',v_allocation.id,p_actor
    );

    select coalesce(sum(case when a.allocation_kind='settlement'
      then a.allocated_amount else -a.allocated_amount end),0)
      into v_net
    from public.rubi_finance_allocations a
    where a.obligation_id=v_allocation.obligation_id;

    update public.rubi_finance_obligations
    set status=case
      when v_net>=expected_amount then 'settled'
      when v_net>0 then 'partially_settled'
      when due_at is not null and due_at<now() then 'overdue'
      else 'open'
    end,
    updated_at=now()
    where id=v_allocation.obligation_id;
  end loop;

  select u.email into v_actor_email from auth.users u where u.id=p_actor;
  insert into public.admin_audit_log(
    actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
    p_actor,v_actor_email,'RUBI_FINANCE_ENTRY_REVERSED','finance_entry',v_reversal_id,
    jsonb_build_object('original_entry_id',v_original.id,'direction',v_original.direction),
    jsonb_build_object(
      'reversal_entry_id',v_reversal_id,'direction',
      case when v_original.direction='inflow' then 'outflow' else 'inflow' end,
      'amount',v_original.amount,'currency',v_original.currency,
      'ledger_only_reversal',true,'reason',btrim(p_reason)
    )
  );
  return v_reversal_id;
end;
$$;

revoke all on function public.rubi_finance_allocate_entry(uuid,uuid,numeric,uuid,text)
  from public,anon,authenticated;
grant execute on function public.rubi_finance_allocate_entry(uuid,uuid,numeric,uuid,text)
  to service_role;
revoke all on function public.rubi_finance_reverse_entry(uuid,timestamptz,text,uuid)
  from public,anon,authenticated;
grant execute on function public.rubi_finance_reverse_entry(uuid,timestamptz,text,uuid)
  to service_role;

comment on function public.rubi_finance_allocate_entry(uuid,uuid,numeric,uuid,text)
  is 'Owner-authorized atomic allocation; locks entry and obligation, caps both balances and audits the change.';
comment on function public.rubi_finance_reverse_entry(uuid,timestamptz,text,uuid)
  is 'Owner-authorized ledger-only reversal; creates a compensating entry and reversal allocations. Does not reverse funds at an external provider.';
