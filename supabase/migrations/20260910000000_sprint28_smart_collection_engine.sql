-- Sprint 28: Smart Collection Engine
-- Foundation + candidate engine. Safe to apply after existing product/offer/audit infrastructure.

create extension if not exists pgcrypto;

create table if not exists public.curated_collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  image_url text,
  collection_type text not null default 'editorial',
  candidate_rules jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curated_collections_type_check check (collection_type in ('achadinhos','trending','offers','category','seasonal','personalized','editorial'))
);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.curated_collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique(collection_id, product_id)
);

create table if not exists public.collection_candidates (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.curated_collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  matched_signal jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  priority integer not null default 0,
  suggested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  constraint collection_candidates_status_check check (status in ('pending','approved','rejected')),
  unique(collection_id, product_id)
);

create index if not exists idx_collection_items_collection_position on public.collection_items(collection_id, position);
create index if not exists idx_collection_candidates_pending on public.collection_candidates(collection_id, status, priority desc, suggested_at desc);
create index if not exists idx_collection_candidates_product on public.collection_candidates(product_id);

alter table public.curated_collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.collection_candidates enable row level security;

create policy if not exists "Public can view active curated collections" on public.curated_collections for select using (is_active = true);
create policy if not exists "Owners can manage curated collections" on public.curated_collections for all using (has_role(auth.uid(), 'owner'::app_role)) with check (has_role(auth.uid(), 'owner'::app_role));
create policy if not exists "Public can view items of active collections" on public.collection_items for select using (exists (select 1 from public.curated_collections c where c.id = collection_items.collection_id and c.is_active = true));
create policy if not exists "Owners can manage collection items" on public.collection_items for all using (has_role(auth.uid(), 'owner'::app_role)) with check (has_role(auth.uid(), 'owner'::app_role));
create policy if not exists "Owners can manage collection candidates" on public.collection_candidates for all using (has_role(auth.uid(), 'owner'::app_role)) with check (has_role(auth.uid(), 'owner'::app_role));

create or replace function public.generate_collection_candidates(p_collection_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.curated_collections%rowtype; r jsonb; n integer := 0; min_d numeric; min_t numeric; min_dm numeric; min_o numeric; req boolean;
begin
  if not has_role(auth.uid(),'owner'::app_role) then raise exception 'not authorized'; end if;
  select * into c from public.curated_collections where id=p_collection_id;
  if not found then raise exception 'collection not found'; end if;
  r:=coalesce(c.candidate_rules,'{}'::jsonb);
  if jsonb_typeof(r)<>'object' then raise exception 'candidate_rules must be an object'; end if;
  min_d:=coalesce((r->>'min_discount')::numeric,0); min_t:=coalesce((r->>'min_trend_velocity')::numeric,0); min_dm:=coalesce((r->>'min_demand_score')::numeric,0); min_o:=coalesce((r->>'min_offer_score')::numeric,0); req:=coalesce((r->>'require_active_offer')::boolean,false);
  insert into public.collection_candidates(collection_id,product_id,matched_signal,status,suggested_at)
  select c.id,p.id,jsonb_build_object('discount',coalesce(p.discount,0),'trend_velocity',p.trend_velocity,'demand_score',p.demand_score,'offer_score',coalesce(p.offer_score,0),'matched_rules',jsonb_build_array('discount >= '||min_d,'trend_velocity >= '||min_t,'demand_score >= '||min_dm,'offer_score >= '||min_o)), 'pending', now()
  from public.products p where p.status in ('active','published') and coalesce(p.discount,0)>=min_d and p.trend_velocity>=min_t and p.demand_score>=min_dm and coalesce(p.offer_score,0)>=min_o and (not req or (p.offer_group_id is not null and p.is_best_offer=true)) and not exists(select 1 from public.collection_items i where i.collection_id=c.id and i.product_id=p.id)
  on conflict(collection_id,product_id) do update set matched_signal=excluded.matched_signal,suggested_at=now() where public.collection_candidates.status='pending';
  get diagnostics n=row_count;
  return jsonb_build_object('collection_id',p_collection_id,'generated',n);
end; $$;

create or replace function public.simulate_collection_candidates(p_collection_id uuid,p_rules jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare n integer; samples jsonb;
begin
  if not has_role(auth.uid(),'owner'::app_role) then raise exception 'not authorized'; end if;
  if jsonb_typeof(coalesce(p_rules,'{}'::jsonb))<>'object' then raise exception 'candidate_rules must be an object'; end if;
  select count(*) into n from public.products p where p.status in ('active','published') and coalesce(p.discount,0)>=coalesce((p_rules->>'min_discount')::numeric,0) and p.trend_velocity>=coalesce((p_rules->>'min_trend_velocity')::numeric,0) and p.demand_score>=coalesce((p_rules->>'min_demand_score')::numeric,0) and coalesce(p.offer_score,0)>=coalesce((p_rules->>'min_offer_score')::numeric,0) and (not coalesce((p_rules->>'require_active_offer')::boolean,false) or (p.offer_group_id is not null and p.is_best_offer=true));
  select coalesce(jsonb_agg(x),'[]'::jsonb) into samples from (select jsonb_build_object('id',p.id,'title',p.title,'discount',coalesce(p.discount,0),'trend_velocity',p.trend_velocity,'demand_score',p.demand_score,'offer_score',coalesce(p.offer_score,0)) x from public.products p where p.status in ('active','published') and coalesce(p.discount,0)>=coalesce((p_rules->>'min_discount')::numeric,0) and p.trend_velocity>=coalesce((p_rules->>'min_trend_velocity')::numeric,0) and p.demand_score>=coalesce((p_rules->>'min_demand_score')::numeric,0) and coalesce(p.offer_score,0)>=coalesce((p_rules->>'min_offer_score')::numeric,0) limit 10)s;
  return jsonb_build_object('count',n,'samples',samples);
end; $$;

create or replace function public.approve_collection_candidate(p_candidate_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare c public.collection_candidates%rowtype; item_id uuid; actor uuid:=auth.uid();
begin
  if not has_role(actor,'owner'::app_role) then raise exception 'not authorized'; end if;
  select * into c from public.collection_candidates where id=p_candidate_id for update;
  if not found then raise exception 'candidate not found'; end if;
  if c.status<>'pending' then raise exception 'candidate is not pending'; end if;
  insert into public.collection_items(collection_id,product_id,position) values(c.collection_id,c.product_id,coalesce((select max(position)+1 from public.collection_items where collection_id=c.collection_id),0)) on conflict(collection_id,product_id) do update set position=excluded.position returning id into item_id;
  update public.collection_candidates set status='approved',reviewed_at=now(),reviewed_by=actor where id=p_candidate_id;
  insert into public.admin_audit_log(actor_user_id,action_type,entity_type,entity_id,previous_value,new_value) values(actor,'collection_candidate_approved','collection_candidate',p_candidate_id,jsonb_build_object('status','pending'),jsonb_build_object('status','approved','collection_item_id',item_id));
  return item_id;
end; $$;

create or replace function public.reject_collection_candidate(p_candidate_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare old_status text; actor uuid:=auth.uid();
begin
  if not has_role(actor,'owner'::app_role) then raise exception 'not authorized'; end if;
  select status into old_status from public.collection_candidates where id=p_candidate_id for update;
  if not found then raise exception 'candidate not found'; end if;
  if old_status<>'pending' then raise exception 'candidate is not pending'; end if;
  update public.collection_candidates set status='rejected',reviewed_at=now(),reviewed_by=actor where id=p_candidate_id;
  insert into public.admin_audit_log(actor_user_id,action_type,entity_type,entity_id,previous_value,new_value) values(actor,'collection_candidate_rejected','collection_candidate',p_candidate_id,jsonb_build_object('status',old_status),jsonb_build_object('status','rejected'));
  return true;
end; $$;

grant execute on function public.generate_collection_candidates(uuid) to authenticated;
grant execute on function public.simulate_collection_candidates(uuid,jsonb) to authenticated;
grant execute on function public.approve_collection_candidate(uuid) to authenticated;
grant execute on function public.reject_collection_candidate(uuid) to authenticated;
