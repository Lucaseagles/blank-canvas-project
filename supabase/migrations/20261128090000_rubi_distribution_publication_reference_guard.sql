-- Sprint 367: manual publication status requires a platform-specific HTTPS permalink.
-- A manually entered reference is still not independent proof of reach or delivery.
create or replace function public.rubi_valid_distribution_publication_reference(
  p_channel text,
  p_reference text
) returns boolean
language sql
immutable
set search_path = ''
as $function$
  select case p_channel
    when 'instagram' then
      coalesce(p_reference, '') ~* '^https://(www\\.)?instagram\\.com/(p|reel)/[A-Za-z0-9_-]+/?$'
    when 'tiktok' then
      coalesce(p_reference, '') ~* '^https://(www\\.|m\\.)?tiktok\\.com/@[A-Za-z0-9._]+/video/[0-9]+/?$'
    when 'youtube' then
      coalesce(p_reference, '') ~* '^https://(www\\.)?youtube\\.com/shorts/[A-Za-z0-9_-]{6,}/?$'
      or coalesce(p_reference, '') ~* '^https://(www\\.)?youtube\\.com/watch\\?v=[A-Za-z0-9_-]{6,}(&[^#]*)?$'
      or coalesce(p_reference, '') ~* '^https://youtu\\.be/[A-Za-z0-9_-]{6,}/?$'
    when 'facebook' then
      coalesce(p_reference, '') ~* '^https://(www\\.|m\\.)?facebook\\.com/.+/(posts|videos|reel)/[A-Za-z0-9_-]+/?$'
      or coalesce(p_reference, '') ~* '^https://(www\\.)?facebook\\.com/watch/?\\?v=[A-Za-z0-9_-]+(&[^#]*)?$'
    when 'pinterest' then
      coalesce(p_reference, '') ~* '^https://(www\\.)?pinterest\\.com/pin/[0-9]+/?$'
    when 'telegram' then
      coalesce(p_reference, '') ~* '^https://(t\\.me|telegram\\.me)/[A-Za-z0-9_]{5,}/[0-9]+/?$'
      or coalesce(p_reference, '') ~* '^https://(t\\.me|telegram\\.me)/c/[0-9]+/[0-9]+/?$'
    -- WhatsApp share/invite URLs are not proof of a published message.
    -- Keep it planned until a provider-confirmed connector supplies an ID.
    else false
  end;
$function$;

revoke all on function public.rubi_valid_distribution_publication_reference(text,text)
  from public, anon, authenticated;
grant execute on function public.rubi_valid_distribution_publication_reference(text,text)
  to service_role;

create or replace function public.rubi_distribution_publication_reference_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $trigger$
begin
  if new.status = 'manually_published'
     and not public.rubi_valid_distribution_publication_reference(new.channel,new.published_reference) then
    raise exception 'A platform-specific HTTPS publication permalink is required; WhatsApp requires provider confirmation.';
  end if;
  return new;
end;
$trigger$;

revoke all on function public.rubi_distribution_publication_reference_guard()
  from public, anon, authenticated;
grant execute on function public.rubi_distribution_publication_reference_guard()
  to service_role;

drop trigger if exists rubi_distribution_publication_reference_guard_trg
  on public.rubi_movement_distribution;
create trigger rubi_distribution_publication_reference_guard_trg
before insert or update of channel,status,published_reference
on public.rubi_movement_distribution
for each row execute function public.rubi_distribution_publication_reference_guard();

comment on function public.rubi_valid_distribution_publication_reference(text,text)
  is 'Validates platform-specific HTTPS permalinks for manually declared publication; does not prove external delivery or reach.';
