-- RUBI 191: onboarding quiz is one atomic operation and never grants commercial access.
alter table public.commercial_profiles add column if not exists qualification_answers jsonb not null
 default '{}'::jsonb check(jsonb_typeof(qualification_answers)='object' and
  pg_catalog.octet_length(qualification_answers::text)<=3000);
create or replace function public.rubi_complete_commercial_onboarding(
 p_actor uuid,p_audience text,p_partner_type text,p_name text,p_business_name text,
 p_instagram text,p_document text,p_notes text,p_answers jsonb,p_categories uuid[]
) returns table(saved_id uuid)
language plpgsql security invoker set search_path=''
as $$
declare result_id uuid; cat_count integer; cnt integer;
begin
 if p_actor is null or not exists(select 1 from auth.users u where u.id=p_actor)
 then raise exception 'Authenticated user required'; end if;
 if p_audience not in ('consumer','merchant','partner')
 or char_length(btrim(coalesce(p_name,''))) not between 2 and 120
 or char_length(coalesce(p_notes,''))>500
 or char_length(coalesce(p_instagram,''))>100
 or char_length(coalesce(p_document,''))>30
 or p_answers is null or jsonb_typeof(p_answers)<>'object'
 or pg_catalog.octet_length(p_answers::text)>3000
 then raise exception 'Invalid onboarding fields'; end if;
 if p_audience='merchant' and (char_length(btrim(coalesce(p_business_name,'')))<2
  or p_answers->>'merchant_segment' not in ('fashion','beauty','home','electronics','other')
  or p_answers->>'restock_frequency' not in ('weekly','monthly','quarterly','unsure')
  or p_answers->>'batch_size' not in ('1_4','5_9','10_29','30_plus','unsure'))
 then raise exception 'Complete merchant qualification'; end if;
 if p_audience='partner' and (p_partner_type not in ('micro_influencer','influencer','affiliate','expert')
  or p_answers->>'niche' is null or char_length(p_answers->>'niche')>80
  or p_answers->>'creator_background' not in ('professional','creator','both','unspecified')
  or p_answers->>'audience_range' not in ('under_1000','1000_10000','10000_100000','over_100000','unspecified')
  or p_answers->>'channel' not in ('instagram','tiktok','youtube','whatsapp','other','unspecified'))
 then raise exception 'Complete partner qualification'; end if;
 if p_audience='consumer' then
  if p_partner_type is not null or p_categories is null
    or cardinality(p_categories)>20 or array_position(p_categories,null) is not null
    or (select count(distinct x) from unnest(p_categories) x)<>cardinality(p_categories)
  then raise exception 'Invalid consumer categories'; end if;
  select count(*) into cat_count from public.categories c where c.id=any(p_categories) and c.is_active=true;
  if cat_count<>cardinality(p_categories) then raise exception 'Unknown or inactive category'; end if;
 else
  if cardinality(coalesce(p_categories,'{}'::uuid[]))>0 then
   raise exception 'Categories apply only to consumer preference quiz'; end if;
 end if;
 if p_audience<>'partner' and p_partner_type is not null then raise exception 'Invalid partner type'; end if;
 if exists(select 1 from public.commercial_profiles p where p.user_id=p_actor and p.audience=p_audience)
 then raise exception 'Profile already exists'; end if;
 insert into public.commercial_profiles(user_id,audience,partner_type,display_name,business_name,
  instagram_handle,business_document,notes,status,qualification_answers)
 values(p_actor,p_audience,p_partner_type,btrim(p_name),
  case when p_audience='merchant' then btrim(p_business_name) else null end,
  case when p_audience='partner' then nullif(btrim(p_instagram),'') else null end,
  case when p_audience='merchant' then nullif(btrim(p_document),'') else null end,
  nullif(btrim(p_notes),''),'pending',p_answers)
 returning id into result_id;
 -- Only explicit consumer answers, never inferred behavioral history.
 if p_audience='consumer' then
  insert into public.user_preferences(user_id,preferred_categories)
  values(p_actor,p_categories)
  on conflict(user_id) do update set preferred_categories=excluded.preferred_categories;
 end if;
 return query select result_id;
end;
$$;
revoke all on function public.rubi_complete_commercial_onboarding(uuid,text,text,text,text,text,text,text,jsonb,uuid[])
 from public,anon,authenticated;
grant execute on function public.rubi_complete_commercial_onboarding(uuid,text,text,text,text,text,text,text,jsonb,uuid[])
 to service_role;
