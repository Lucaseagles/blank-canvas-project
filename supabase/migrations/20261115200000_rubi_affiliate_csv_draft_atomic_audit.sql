-- RUBI Sprint 214 — marketplace affiliate drafts are imported as one Owner-audited transaction.
-- Never publish or interpret an affiliate outbound click as a paid sale.
create or replace function public.rubi_import_affiliate_drafts_audited(p_rows jsonb,p_actor uuid)
returns integer language plpgsql security invoker set search_path=''
as $rubi$
declare
 v_row jsonb;
 v_id uuid;
 v_title text;
 v_url text;
 v_category uuid;
 v_marketplace uuid;
 v_price numeric;
 v_old_price numeric;
 v_discount numeric;
 v_rating numeric;
 v_reviews numeric;
 v_count integer := 0;
begin
 if p_actor is null or not exists(
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner authorization required'; end if;
 if jsonb_typeof(p_rows)<>'array' then raise exception 'CSV payload must be an array'; end if;
 if jsonb_array_length(p_rows)<1 or jsonb_array_length(p_rows)>100 then
  raise exception 'CSV must contain between 1 and 100 rows'; end if;
 -- Lock stops concurrent duplicate import races, and the entire batch rolls back on error.
 perform pg_advisory_xact_lock(20261115,214);
 for v_row in select value from jsonb_array_elements(p_rows) loop
  if jsonb_typeof(v_row)<>'object' then raise exception 'Invalid CSV row'; end if;
  v_title:=btrim(coalesce(v_row->>'title',''));
  v_url:=btrim(coalesce(v_row->>'affiliate_url',''));
  v_price:=nullif(v_row->>'current_price','')::numeric;
  v_old_price:=nullif(v_row->>'previous_price','')::numeric;
  v_discount:=nullif(v_row->>'discount','')::numeric;
  v_rating:=nullif(v_row->>'rating','')::numeric;
  v_reviews:=nullif(v_row->>'review_count','')::numeric;
  v_category:=nullif(v_row->>'category_id','')::uuid;
  v_marketplace:=nullif(v_row->>'marketplace_id','')::uuid;
  if length(v_title) not between 2 and 200
   or v_price is null or v_price<=0 or v_price>1000000
   or v_price<>round(v_price,2)
   or length(v_url) not between 10 and 2048
   or v_url !~* '^https://[a-z0-9][a-z0-9.-]+(:[0-9]{1,5})?([/?#]|$)'
  then raise exception 'Invalid marketplace draft values'; end if;
  if v_old_price is not null and (v_old_price<v_price or v_old_price>1000000
   or v_old_price<>round(v_old_price,2))
  then raise exception 'Invalid previous price'; end if;
  if v_discount is not null and (v_discount<0 or v_discount>100 or v_discount<>trunc(v_discount))
  then raise exception 'Invalid discount'; end if;
  if v_rating is not null and (v_rating<0 or v_rating>5) then raise exception 'Invalid rating'; end if;
  if v_reviews is not null and (v_reviews<0 or v_reviews>10000000
   or v_reviews<>trunc(v_reviews))
  then raise exception 'Invalid review count'; end if;
  perform 1 from public.marketplaces m where m.id=v_marketplace and m.status='active';
  if not found then raise exception 'Unknown or disabled marketplace'; end if;
  if v_category is not null then
   perform 1 from public.categories c where c.id=v_category and c.is_active=true;
   if not found then raise exception 'Unknown or inactive category'; end if;
  end if;
  if exists(select 1 from public.products p
   where lower(btrim(p.title))=lower(v_title)
    and lower(btrim(coalesce(p.affiliate_url,'')))=lower(v_url))
  then raise exception 'Product already exists for this affiliate link'; end if;
  insert into public.products(
   title,description,current_price,previous_price,discount,rating,review_count,
   status,affiliate_url,category_id,marketplace_id,free_shipping,images,updated_at
  ) values(
   v_title,nullif(btrim(coalesce(v_row->>'description','')),''),
   v_price,v_old_price,v_discount,v_rating,v_reviews,
   'draft',v_url,v_category,v_marketplace,
   coalesce((v_row->>'free_shipping')::boolean,false),'{}'::text[],now()
  ) returning id into v_id;
  insert into public.admin_audit_log(
   actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value
  ) values (
   p_actor,null,'RUBI_AFFILIATE_CSV_DRAFT_IMPORTED','products',v_id,
   '{}'::jsonb,jsonb_build_object('status','draft','marketplace_id',v_marketplace,
    'category_id',v_category,'current_price',v_price)
  );
  v_count:=v_count+1;
 end loop;
 return v_count;
end;
$rubi$;
revoke all on function public.rubi_import_affiliate_drafts_audited(jsonb,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_import_affiliate_drafts_audited(jsonb,uuid)
 to service_role;
comment on function public.rubi_import_affiliate_drafts_audited(jsonb,uuid)
 is 'Owner-only atomic affiliate marketplace draft import; deliberately never creates published products or financial events.';
