-- RUBI Business: solicitações de orçamento, sem pedido ou cobrança.
create table if not exists public.hub_merchant_quote_requests (
 id uuid primary key default gen_random_uuid(),
 commercial_profile_id uuid not null references public.commercial_profiles(id),
 status text not null default 'requested' check (status in ('requested','reviewing','responded','closed')),
 total_estimate numeric(14,2) not null check (total_estimate > 0),
 created_at timestamptz not null default now()
);
create table if not exists public.hub_merchant_quote_items (
 id uuid primary key default gen_random_uuid(),
 quote_request_id uuid not null references public.hub_merchant_quote_requests(id) on delete cascade,
 product_id uuid not null references public.hub_products(id),
 product_title text not null,
 quantity integer not null check (quantity > 0),
 unit_price_snapshot numeric(14,2) not null check (unit_price_snapshot > 0),
 line_total numeric(14,2) not null check (line_total > 0),
 unique(quote_request_id,product_id)
);
create index if not exists hub_merchant_quote_requests_profile_idx on public.hub_merchant_quote_requests(commercial_profile_id,created_at desc);
create index if not exists hub_merchant_quote_items_quote_idx on public.hub_merchant_quote_items(quote_request_id);
alter table public.hub_merchant_quote_requests enable row level security;
alter table public.hub_merchant_quote_items enable row level security;
revoke all on public.hub_merchant_quote_requests from anon,authenticated;
revoke all on public.hub_merchant_quote_items from anon,authenticated;
-- Service-role-only atomic creation. No payment, stock reservation or order.
create or replace function public.hub_create_merchant_quote(
 p_profile_id uuid,
 p_lines jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare
 v_quote_id uuid;
 v_line jsonb;
 v_product public.hub_products%rowtype;
 v_quantity integer;
 v_price numeric(14,2);
 v_total numeric(14,2):=0;
 v_count integer;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'service_role required'; end if;
 if not exists(select 1 from public.commercial_profiles where id=p_profile_id and audience='merchant' and status='approved') then raise exception 'Approved merchant required'; end if;
 if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 or jsonb_array_length(p_lines) > 30 then raise exception 'Invalid quote lines'; end if;
 if (select count(distinct item->>'product_id') from jsonb_array_elements(p_lines) item) <> jsonb_array_length(p_lines) then raise exception 'Duplicate products'; end if;
 for v_line in select value from jsonb_array_elements(p_lines) loop
   if jsonb_typeof(v_line) <> 'object' or (v_line->>'quantity') !~ '^[0-9]{1,8}$' then raise exception 'Invalid quantity'; end if;
   v_quantity:=(v_line->>'quantity')::integer;
   select * into v_product from public.hub_products where id=(v_line->>'product_id')::uuid and active=true and b2b_base_price>0;
   if not found or v_quantity<v_product.min_b2b_quantity then raise exception 'Product unavailable or below minimum'; end if;
   select coalesce((select t.unit_price from public.hub_b2b_tiers t where t.product_id=v_product.id and t.min_quantity<=v_quantity and t.min_quantity>=v_product.min_b2b_quantity order by t.min_quantity desc limit 1),v_product.b2b_base_price) into v_price;
   if v_price<=0 then raise exception 'Invalid price'; end if;
   v_total:=v_total+round(v_price*v_quantity,2);
 end loop;
 insert into public.hub_merchant_quote_requests(commercial_profile_id,total_estimate) values(p_profile_id,v_total) returning id into v_quote_id;
 for v_line in select value from jsonb_array_elements(p_lines) loop
   v_quantity:=(v_line->>'quantity')::integer;
   select * into v_product from public.hub_products where id=(v_line->>'product_id')::uuid;
   select coalesce((select t.unit_price from public.hub_b2b_tiers t where t.product_id=v_product.id and t.min_quantity<=v_quantity and t.min_quantity>=v_product.min_b2b_quantity order by t.min_quantity desc limit 1),v_product.b2b_base_price) into v_price;
   insert into public.hub_merchant_quote_items(quote_request_id,product_id,product_title,quantity,unit_price_snapshot,line_total) values(v_quote_id,v_product.id,v_product.title,v_quantity,v_price,round(v_price*v_quantity,2));
 end loop;
 return v_quote_id;
end $$;
revoke all on function public.hub_create_merchant_quote(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.hub_create_merchant_quote(uuid,jsonb) to service_role;
