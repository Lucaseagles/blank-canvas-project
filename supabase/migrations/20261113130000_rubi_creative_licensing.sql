-- Sprint 174: private documentary review of creative licenses; no automatic publication.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('rubi-creative-license-evidence','rubi-creative-license-evidence',false,10485760,
 array['application/pdf','image/png','image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=10485760,
 allowed_mime_types=excluded.allowed_mime_types;

-- Evidence access uses a private bucket; deny browser policies for this bucket.
-- Existing policies for other storage buckets must remain unaffected.

create table if not exists public.rubi_creative_licenses(
 id uuid primary key default gen_random_uuid(),
 variant_id uuid not null unique references public.rubi_movement_variants(id) on delete restrict,
 evidence_path text not null unique,
 permitted_channels text[] not null default '{}',
 permitted_audiences text[] not null default '{}',
 valid_from timestamptz not null,
 valid_until timestamptz not null,
 status text not null default 'draft' check(status in ('draft','approved','revoked')),
 revision integer not null default 1 check(revision>0),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 approved_variant_revision integer,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint rubi_license_period check(valid_until>valid_from),
 constraint rubi_license_path check(evidence_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|png|jpg)$'),
 constraint rubi_license_channels check(permitted_channels <@ array['instagram','tiktok','youtube','whatsapp','telegram','site']::text[]),
 constraint rubi_license_audiences check(permitted_audiences <@ array['partner','consumer','merchant']::text[]),
 constraint rubi_license_approval check(status <> 'approved' or (reviewed_by is not null and reviewed_at is not null and approved_variant_revision is not null and cardinality(permitted_channels)>0 and cardinality(permitted_audiences)>0))
);
create index if not exists rubi_creative_licenses_status_idx on public.rubi_creative_licenses(status,valid_until);
alter table public.rubi_creative_licenses enable row level security;
revoke all on public.rubi_creative_licenses from public,anon,authenticated;
grant select,insert,update on public.rubi_creative_licenses to service_role;

-- Invoker-only RPC ensures license lifecycle + admin history commit atomically.
create or replace function public.rubi_mutate_creative_license_audited(
 p_actor uuid,p_variant_id uuid,p_expected_revision integer,
 p_evidence_path text,p_channels text[],p_audiences text[],
 p_valid_from timestamptz,p_valid_until timestamptz,p_action text
) returns table(license_id uuid,new_revision integer)
language plpgsql security invoker set search_path=''
as $$
declare old_record public.rubi_creative_licenses%rowtype;
        new_record public.rubi_creative_licenses%rowtype;
        variant_record public.rubi_movement_variants%rowtype;
        movement_status text;
        evidence_exists boolean;
begin
 if p_actor is null or not exists(select 1 from public.user_roles where user_id=p_actor and role='owner') then
  raise exception 'Owner authorization required';
 end if;
 if p_action not in ('draft','approve','revoke') then raise exception 'Invalid license action'; end if;
 select * into variant_record from public.rubi_movement_variants where id=p_variant_id for share;
 if not found then raise exception 'Unknown creative variant'; end if;
 select m.status into movement_status from public.rubi_movements m where m.id=variant_record.movement_id;
 if p_action='approve' and (variant_record.status<>'review' or
    variant_record.media_rights_confirmed is distinct from true or movement_status<>'review') then
  raise exception 'Variant and movement require reviewed rights';
 end if;
 select * into old_record from public.rubi_creative_licenses where variant_id=p_variant_id for update;
 if found then
   if p_expected_revision is null or p_expected_revision<>old_record.revision then
     raise exception 'License changed concurrently';
   end if;
 else
   if p_action<>'draft' or p_expected_revision is not null then
     raise exception 'Create draft before review';
   end if;
 end if;
 if p_action='approve' then
  if p_valid_until<=now() or p_valid_from is null or p_valid_until is null
     or cardinality(p_channels)=0 or cardinality(p_audiences)=0 then
   raise exception 'Valid scope and future expiry required';
  end if;
  -- Signed upload completion does not itself prove license authenticity.
  select exists(select 1 from storage.objects
    where bucket_id='rubi-creative-license-evidence' and name=old_record.evidence_path
    and metadata->>'mimetype' in ('application/pdf','image/png','image/jpeg')) into evidence_exists;
  if not evidence_exists then raise exception 'Document upload not found'; end if;
 end if;
 if p_action='draft' then
   if old_record.id is not null and old_record.status<>'draft' then
    raise exception 'Approved or revoked license cannot be edited into draft'; end if;
   if p_evidence_path is null or p_evidence_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|png|jpg)$' then
    raise exception 'Evidence must use controlled private path'; end if;
   if old_record.id is null then
    insert into public.rubi_creative_licenses(variant_id,evidence_path,permitted_channels,
       permitted_audiences,valid_from,valid_until)
    values(p_variant_id,p_evidence_path,coalesce(p_channels,'{}'),coalesce(p_audiences,'{}'),
       p_valid_from,p_valid_until) returning * into new_record;
   else
    update public.rubi_creative_licenses set evidence_path=p_evidence_path,
      permitted_channels=coalesce(p_channels,'{}'),permitted_audiences=coalesce(p_audiences,'{}'),
      valid_from=p_valid_from,valid_until=p_valid_until,revision=revision+1,updated_at=now()
    where id=old_record.id returning * into new_record;
   end if;
 elsif p_action='approve' then
   update public.rubi_creative_licenses set status='approved',reviewed_by=p_actor,
     reviewed_at=now(),approved_variant_revision=variant_record.revision,revoked_at=null,revision=revision+1,updated_at=now()
   where id=old_record.id and status='draft' returning * into new_record;
 else
   update public.rubi_creative_licenses set status='revoked',revoked_at=now(),
     revision=revision+1,updated_at=now()
   where id=old_record.id and status='approved' returning * into new_record;
 end if;
 if new_record.id is null then raise exception 'License transition not allowed'; end if;
 insert into public.admin_audit_log(actor_user_id,actor_email,action_type,entity_type,entity_id,previous_value,new_value)
 values(p_actor,null,'RUBI_CREATIVE_LICENSE_'||upper(p_action),'rubi_creative_license',new_record.id,
 jsonb_build_object('status',old_record.status,'revision',old_record.revision),
 jsonb_build_object('status',new_record.status,'revision',new_record.revision,'variant_id',p_variant_id));
 return query select new_record.id,new_record.revision;
end;
$$;
revoke all on function public.rubi_mutate_creative_license_audited(uuid,uuid,integer,text,text[],text[],timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function public.rubi_mutate_creative_license_audited(uuid,uuid,integer,text,text[],text[],timestamptz,timestamptz,text) to service_role;
