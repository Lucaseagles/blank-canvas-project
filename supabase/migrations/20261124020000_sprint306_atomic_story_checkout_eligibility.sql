-- Sprint 306: make Story publication eligibility atomic with the Story approval write.
-- The server-side preflight remains useful for UX, but is not the authorization boundary.
-- Lock the product and supplier rows while checking their commercial eligibility so a
-- concurrent deactivation or checkout edit cannot race the approval transaction.
create or replace function public.rubi_set_story_approval_audited(
 p_story_id uuid,
 p_product_id uuid,
 p_expected_revision integer,
 p_approved boolean,
 p_actor uuid
)
returns void
language plpgsql security invoker
set search_path = ''
as $$
declare
 s public.rubi_product_stories%rowtype;
 m public.rubi_movements%rowtype;
 next_status text;
 next_pin integer;
begin
 if p_actor is null or not exists (
  select 1 from public.user_roles r where r.user_id=p_actor and r.role='owner'
 ) then raise exception 'Owner actor required';
 end if;
 if p_approved is null then raise exception 'Explicit approval decision required'; end if;

 select * into s from public.rubi_product_stories
  where id=p_story_id and product_id=p_product_id for update;
 if not found or s.revision is distinct from p_expected_revision then
  raise exception 'Story changed; reload before approving';
 end if;

 if p_approved then
  if not s.rights_confirmed or coalesce(length(trim(s.evidence_notes)),0)<12
  then raise exception 'Story evidence and media rights are required'; end if;
  if s.movement_id is null then raise exception 'Reviewed movement required'; end if;

  -- Repeat the commercial preflight inside the same transaction as approval.
  -- Keep this hostname grammar aligned with normalizeRubiCheckoutHost in TypeScript.
  perform 1
   from public.hub_products p
   join public.hub_suppliers supplier on supplier.id=p.supplier_id
   where p.id=p_product_id
    and p.active=true
    and p.checkout_verified=true
    and p.retail_price>0
    and p.checkout_url is not null
    and supplier.active=true
    and supplier.checkout_host is not null
    and char_length(supplier.checkout_host) between 4 and 253
    and supplier.checkout_host ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z]{2,63}$'
    and p.checkout_url ~ ('^https://' || replace(supplier.checkout_host,'.','[.]') || '(/|[?]|$)')
    and p.checkout_url !~ '[#@]'
    and p.checkout_url !~ '[[:space:]]'
    and strpos(p.checkout_url,chr(92))=0
   for share of p,supplier;
  if not found then
   raise exception 'Active product and supplier with verified official checkout are required';
  end if;

  select * into m from public.rubi_movements
   where id=s.movement_id and product_id=p_product_id for share;
  if not found or m.status<>'review' or m.audience<>'consumer'
  then raise exception 'Reviewed consumer movement required'; end if;
  next_pin:=m.revision;
 else
  next_pin:=null;
 end if;

 next_status:=case when p_approved then 'approved' else 'draft' end;
 update public.rubi_product_stories
 set status=next_status,approved_movement_revision=next_pin,
  revision=s.revision+1,updated_at=now()
 where id=s.id and revision=s.revision;
 if not found then raise exception 'Concurrent Story revision conflict'; end if;

 insert into public.admin_audit_log(
  actor_user_id,actor_email,action_type,entity_type,entity_id,
  previous_value,new_value
 ) values(
  p_actor,null,
  case when p_approved then 'RUBI_STORY_APPROVED' else 'RUBI_STORY_REVOKED' end,
  'rubi_product_story',s.id,
  jsonb_build_object('status',s.status,'revision',s.revision,
    'approved_movement_revision',s.approved_movement_revision),
  jsonb_build_object('status',next_status,'revision',s.revision+1,
    'approved_movement_revision',next_pin,'product_id',p_product_id)
 );
end;
$$;

revoke all on function public.rubi_set_story_approval_audited(uuid,uuid,integer,boolean,uuid)
 from public,anon,authenticated;
grant execute on function public.rubi_set_story_approval_audited(uuid,uuid,integer,boolean,uuid)
 to service_role;
comment on function public.rubi_set_story_approval_audited(uuid,uuid,integer,boolean,uuid)
 is 'Atomically validates owner actor, rights, active product/supplier verified checkout and reviewed movement before Story state mutation and audit insert.';
