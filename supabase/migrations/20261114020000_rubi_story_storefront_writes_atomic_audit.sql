-- Sprint 183: preserve existing Store/Story interface, ensure every editorial write is named and atomic.
create or replace function public.rubi_save_story_draft_audited(
 p_actor uuid,p_id uuid,p_expected_revision integer,p_product uuid,p_movement uuid,
 p_title text,p_description text,p_video_url text,p_poster_url text,
 p_evidence text,p_rights boolean,p_position integer
) returns table(saved_id uuid,new_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare prior public.rubi_product_stories%rowtype; result_id uuid; result_revision integer;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_title is null or char_length(btrim(p_title)) not between 3 and 160
  or p_description is null or char_length(p_description)>1200
  or p_video_url is null or char_length(p_video_url) not between 14 and 2000
  or p_video_url !~ '^https://[^[:space:]]+[.](mp4|webm)([?][^#[:space:]]*)?$'
  or (p_poster_url is not null and (char_length(p_poster_url)>2000
   or p_poster_url !~ '^https://[^[:space:]]+[.](jpg|jpeg|png|webp)([?][^#[:space:]]*)?$'))
  or p_evidence is null or char_length(p_evidence)>1200
  or p_rights is null or p_position is null or p_position not between 0 and 1000
 then raise exception 'Invalid Story draft'; end if;
 perform 1 from public.hub_products p where p.id=p_product for share;
 if not found then raise exception 'Product not found'; end if;
 if p_movement is not null then
  perform 1 from public.rubi_movements m where m.id=p_movement and m.product_id=p_product for share;
  if not found then raise exception 'Movement does not belong to product'; end if;
 end if;
 if p_id is null then
  if p_expected_revision is not null then raise exception 'Unexpected version'; end if;
  insert into public.rubi_product_stories(product_id,movement_id,title,description,video_url,
   poster_url,evidence_notes,rights_confirmed,position,status,approved_movement_revision)
  values(p_product,p_movement,p_title,p_description,p_video_url,
   p_poster_url,p_evidence,p_rights,p_position,'draft',null)
  returning id,revision into result_id,result_revision;
 else
  select * into prior from public.rubi_product_stories s where s.id=p_id for update;
  if not found or prior.product_id<>p_product or prior.revision is distinct from p_expected_revision
  then raise exception 'Story changed; reload'; end if;
  update public.rubi_product_stories s
   set movement_id=p_movement,title=p_title,description=p_description,video_url=p_video_url,
    poster_url=p_poster_url,evidence_notes=p_evidence,rights_confirmed=p_rights,
    position=p_position,status='draft',approved_movement_revision=null,
    updated_at=now(),revision=prior.revision+1 where s.id=p_id
  returning id,revision into result_id,result_revision;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,
  entity_id,previous_value,new_value)
 values(p_actor,null,case when p_id is null then 'RUBI_STORY_DRAFT_CREATED' else 'RUBI_STORY_DRAFT_UPDATED' end,
  'rubi_product_story',result_id,
  case when prior.id is null then '{}'::jsonb else jsonb_build_object('status',prior.status,'revision',prior.revision) end,
  jsonb_build_object('status','draft','revision',result_revision,'product_id',p_product,
   'rights_confirmed',p_rights));
 return query select result_id,result_revision;
end;
$$;
revoke all on function public.rubi_save_story_draft_audited(uuid,uuid,integer,uuid,uuid,text,text,text,text,text,boolean,integer)
 from public,anon,authenticated;
grant execute on function public.rubi_save_story_draft_audited(uuid,uuid,integer,uuid,uuid,text,text,text,text,text,boolean,integer)
 to service_role;

create or replace function public.rubi_save_storefront_section_audited(
 p_actor uuid,p_id uuid,p_expected_revision integer,p_kind text,p_title text,p_subtitle text,
 p_products uuid[],p_status text,p_starts_at timestamptz,p_ends_at timestamptz,p_position integer
) returns table(saved_id uuid,new_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare prior public.rubi_storefront_sections%rowtype; result_id uuid; result_revision integer;
        item uuid; supplier_host text;
begin
 if p_actor is null or not exists(select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner') then raise exception 'Owner required'; end if;
 if p_kind not in ('hero','collection') or p_title is null or char_length(btrim(p_title)) not between 4 and 100
  or p_subtitle is null or char_length(p_subtitle)>280 or p_status not in ('draft','published')
  or p_products is null or cardinality(p_products) not between 1 and 12 or array_position(p_products,null) is not null
  or (select count(distinct v) from unnest(p_products) v)<>cardinality(p_products)
  or (p_starts_at is not null and p_ends_at is not null and p_starts_at>=p_ends_at)
  or p_position is null or p_position not between 0 and 1000
 then raise exception 'Invalid Store section'; end if;
 if p_status='published' then
  foreach item in array p_products loop
   perform 1 from public.hub_products p join public.hub_suppliers s on s.id=p.supplier_id
    where p.id=item and p.active and p.checkout_verified and p.retail_price>0 and s.active
      and s.checkout_host is not null
      and p.checkout_url ~ ('^https://' || replace(s.checkout_host,'.','[.]') || '(/|[?]|$)')
      and p.checkout_url !~ '[#@]' for share of p,s;
   if not found then raise exception 'All Store products require active verified checkout'; end if;
  end loop;
 else
  -- No product contract is required for an unpublished draft, but all IDs must exist.
  foreach item in array p_products loop
   perform 1 from public.hub_products p where p.id=item for share;
   if not found then raise exception 'Unknown Store product'; end if;
  end loop;
 end if;
 if p_id is null then
  if p_expected_revision is not null then raise exception 'Unexpected section revision'; end if;
  insert into public.rubi_storefront_sections(kind,title,subtitle,product_ids,status,starts_at,ends_at,position)
   values(p_kind,p_title,p_subtitle,p_products,p_status,p_starts_at,p_ends_at,p_position)
  returning id,revision into result_id,result_revision;
 else
  select * into prior from public.rubi_storefront_sections s where s.id=p_id for update;
  if not found or prior.revision is distinct from p_expected_revision then raise exception 'Store section changed; reload'; end if;
  update public.rubi_storefront_sections s set kind=p_kind,title=p_title,subtitle=p_subtitle,
   product_ids=p_products,status=p_status,starts_at=p_starts_at,ends_at=p_ends_at,
   position=p_position,revision=prior.revision+1,updated_at=now()
   where s.id=p_id returning id,revision into result_id,result_revision;
 end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,
 entity_id,previous_value,new_value)
 values(p_actor,null,case when p_id is null then 'RUBI_STORE_SECTION_CREATED' else 'RUBI_STORE_SECTION_UPDATED' end,
  'rubi_storefront_section',result_id,
  case when prior.id is null then '{}'::jsonb else jsonb_build_object('status',prior.status,'revision',prior.revision) end,
  jsonb_build_object('status',p_status,'revision',result_revision,'kind',p_kind,'products_count',cardinality(p_products)));
 return query select result_id,result_revision;
end;
$$;
revoke all on function public.rubi_save_storefront_section_audited(uuid,uuid,integer,text,text,text,uuid[],text,timestamptz,timestamptz,integer)
 from public,anon,authenticated;
grant execute on function public.rubi_save_storefront_section_audited(uuid,uuid,integer,text,text,text,uuid[],text,timestamptz,timestamptz,integer)
 to service_role;
