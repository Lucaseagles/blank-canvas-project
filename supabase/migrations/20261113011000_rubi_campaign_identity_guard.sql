-- Enforce unique organic attribution labels per SKU/channel despite simultaneous writes.
-- Older duplicated drafts remain for Master cleanup; all new relevant writes are gated.
create or replace function public.rubi_guard_movement_campaign_identity()
returns trigger language plpgsql set search_path=public as $$
declare
 target_product uuid;
begin
 select m.product_id into target_product
 from public.rubi_movement_variants v
 join public.rubi_movements m on m.id=v.movement_id
 where v.id=new.variant_id;
 if target_product is null then
  raise exception 'Movement variant product not found';
 end if;
 -- Serialize competing writes sharing an SKU+channel+campaign key.
 perform pg_advisory_xact_lock(hashtextextended(
  target_product::text || ':' || new.channel || ':' || new.campaign, 0
 ));
 if exists (
  select 1 from public.rubi_movement_distribution d
  join public.rubi_movement_variants v on v.id=d.variant_id
  join public.rubi_movements m on m.id=v.movement_id
  where m.product_id=target_product
   and d.channel=new.channel and d.campaign=new.campaign
   and d.id is distinct from new.id
 ) then
  raise exception 'Campaign label already in use by this product and channel';
 end if;
 return new;
end;
$$;
revoke all on function public.rubi_guard_movement_campaign_identity() from public,anon,authenticated;
drop trigger if exists rubi_guard_movement_campaign_identity_trg on public.rubi_movement_distribution;
create trigger rubi_guard_movement_campaign_identity_trg
 before insert or update of variant_id,channel,campaign
 on public.rubi_movement_distribution
 for each row execute function public.rubi_guard_movement_campaign_identity();
comment on function public.rubi_guard_movement_campaign_identity() is
 'SKU-scoped transactionally serialized identity check; blocks ambiguous tracking labels even for private drafts. Does not attribute paid orders.';
