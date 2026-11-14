-- Sprint 192: Controlled A/B for already-reviewed consumer Movement Engine variants.
-- Only the Shadow Master can start/pause. A/B traffic is not paid-sale evidence.
create table if not exists public.rubi_movement_ab_experiments (
 id uuid primary key default gen_random_uuid(),
 movement_id uuid not null unique references public.rubi_movements(id) on delete cascade,
 control_variant_id uuid not null references public.rubi_movement_variants(id),
 challenger_variant_id uuid not null references public.rubi_movement_variants(id),
 control_revision integer not null check (control_revision>0),
 challenger_revision integer not null check (challenger_revision>0),
 movement_revision integer not null check (movement_revision>0),
 product_revision integer not null check (product_revision>0),
 status text not null default 'paused' check(status in ('running','paused')),
 allocation_control integer not null default 50 check(allocation_control=50),
 revision integer not null default 1 check(revision>0),
 started_at timestamptz,
 paused_at timestamptz,
 updated_at timestamptz not null default now(),
 check(control_variant_id<>challenger_variant_id)
);
create index if not exists idx_rubi_movement_ab_running on public.rubi_movement_ab_experiments(status,movement_id);
alter table public.rubi_movement_ab_experiments enable row level security;
revoke all on public.rubi_movement_ab_experiments from public,anon,authenticated;
grant select,insert,update,delete on public.rubi_movement_ab_experiments to service_role;

create or replace function public.rubi_configure_movement_ab_audited(
 p_actor uuid,p_movement uuid,p_control uuid,p_challenger uuid,p_expected_revision integer,p_run boolean
) returns table(saved_id uuid,new_revision integer,current_status text)
language plpgsql security invoker set search_path=''
as $$
declare
 previous public.rubi_movement_ab_experiments%rowtype;
 move public.rubi_movements%rowtype;
 product public.hub_products%rowtype;
 v1 public.rubi_movement_variants%rowtype;
 v2 public.rubi_movement_variants%rowtype;
 supplier_active boolean;
 result_id uuid;
 result_revision integer;
 next_status text;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r
  where r.user_id=p_actor and r.role='owner')
 then raise exception 'Owner required';end if;
 if p_run is null or p_control is null or p_challenger is null or p_control=p_challenger
 then raise exception 'Distinct control and challenger are required';end if;
 select * into move from public.rubi_movements m where m.id=p_movement for update;
 if not found then raise exception 'Movement not found';end if;
 select * into previous from public.rubi_movement_ab_experiments e
  where e.movement_id=p_movement for update;
 if previous.id is null and p_expected_revision is not null
  or previous.id is not null and previous.revision is distinct from p_expected_revision
 then raise exception 'Experiment changed; reload';end if;
 if not p_run then
  if previous.id is null then raise exception 'No experiment to pause';end if;
  if previous.status='paused' then raise exception 'Experiment already paused';end if;
  update public.rubi_movement_ab_experiments e
   set status='paused',paused_at=now(),revision=e.revision+1,updated_at=now()
   where e.id=previous.id returning id,revision into result_id,result_revision;
  next_status:='paused';
 else
  if move.status<>'review' or move.audience<>'consumer'
  then raise exception 'Only reviewed consumer movements can be tested';end if;
  select * into product from public.hub_products p where p.id=move.product_id for update;
  if not found or not product.active or not product.checkout_verified
   or nullif(btrim(coalesce(product.checkout_url,'')),'') is null
  then raise exception 'Verified active checkout is required';end if;
  select s.active into supplier_active from public.hub_suppliers s
   where s.id=product.supplier_id;
  if supplier_active is distinct from true then raise exception 'Supplier is not active';end if;
  select * into v1 from public.rubi_movement_variants v
   where v.id=p_control and v.movement_id=p_movement for update;
  if not found then raise exception 'Control variant missing';end if;
  select * into v2 from public.rubi_movement_variants v
   where v.id=p_challenger and v.movement_id=p_movement for update;
  if not found then raise exception 'Challenger variant missing';end if;
  if v1.status<>'review' or v2.status<>'review'
   or not v1.media_rights_confirmed or not v2.media_rights_confirmed
   or v1.format<>v2.format
   or lower(btrim(v1.creative_hook))=lower(btrim(v2.creative_hook))
   or least(char_length(btrim(v1.creative_hook)),char_length(btrim(v2.creative_hook)))<8
   or least(char_length(btrim(v1.creative_script)),char_length(btrim(v2.creative_script)))<20
   or least(char_length(btrim(v1.page_headline)),char_length(btrim(v2.page_headline)))<8
   or least(char_length(btrim(v1.page_body)),char_length(btrim(v2.page_body)))<20
   or least(char_length(btrim(v1.call_to_action)),char_length(btrim(v2.call_to_action)))<5
   or least(char_length(btrim(v1.proof_notes)),char_length(btrim(v2.proof_notes)))<12
  then raise exception 'Control and challenger need distinct, complete, reviewed, licensed creatives';end if;
  -- Serialize activation across *different movements for the same SKU*.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rubi_ab_product_'||product.id::text,192));
  if exists(select 1 from public.rubi_movement_ab_experiments e
    join public.rubi_movements m on m.id=e.movement_id
    where m.product_id=product.id and e.status='running' and e.movement_id<>p_movement)
  then raise exception 'Another A/B experiment is running for this SKU';end if;
  if previous.id is null then
   insert into public.rubi_movement_ab_experiments(
    movement_id,control_variant_id,challenger_variant_id,control_revision,challenger_revision,
    movement_revision,product_revision,status,started_at)
   values(p_movement,p_control,p_challenger,v1.revision,v2.revision,move.revision,
    product.revision,'running',now())
   returning id,revision into result_id,result_revision;
  else
   if previous.status='running' then raise exception 'Pause before restarting A/B';end if;
   update public.rubi_movement_ab_experiments e set
     control_variant_id=p_control,challenger_variant_id=p_challenger,
     control_revision=v1.revision,challenger_revision=v2.revision,
     movement_revision=move.revision,product_revision=product.revision,
     status='running',started_at=now(),paused_at=null,
     revision=e.revision+1,updated_at=now()
   where e.id=previous.id returning id,revision into result_id,result_revision;
  end if;
  next_status:='running';
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,
   previous_value,new_value)
 values(p_actor,null,case when p_run then 'RUBI_AB_STARTED' else 'RUBI_AB_PAUSED' end,
  'rubi_movement_ab_experiment',result_id,
  case when previous.id is null then '{}'::jsonb else
   jsonb_build_object('status',previous.status,'revision',previous.revision) end,
  jsonb_build_object('movement_id',p_movement,'control_id',p_control,
   'challenger_id',p_challenger,'status',next_status,'revision',result_revision,
   'allocation_control_percent',50));
 return query select result_id,result_revision,next_status;
end;
$$;
revoke all on function public.rubi_configure_movement_ab_audited(uuid,uuid,uuid,uuid,integer,boolean)
 from public,anon,authenticated;
grant execute on function public.rubi_configure_movement_ab_audited(uuid,uuid,uuid,uuid,integer,boolean)
 to service_role;
