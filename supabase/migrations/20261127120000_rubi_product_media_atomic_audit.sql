-- Product gallery-only edits must share the same Owner audit boundary as catalog edits.
create or replace function public.rubi_update_product_images_audited(
  p_product_id uuid,
  p_images jsonb,
  p_actor uuid,
  p_expected_updated_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.products%rowtype;
  v_after public.products%rowtype;
  v_images text[];
begin
  if p_actor is null or not exists (
    select 1 from public.user_roles ur
    where ur.user_id = p_actor and ur.role = 'owner'
  ) then
    raise exception 'Owner access required';
  end if;

  if p_product_id is null or p_expected_updated_at is null
     or jsonb_typeof(p_images) is distinct from 'array'
     or jsonb_array_length(p_images) > 30 then
    raise exception 'Invalid product media payload';
  end if;

  if exists (
    select 1 from jsonb_array_elements_text(p_images) as image(value)
    where length(trim(image.value)) = 0
       or length(image.value) > 2000
       or image.value !~* '^https?://[^[:space:]]+$'
  ) then
    raise exception 'Product image URLs must be valid HTTP(S) URLs';
  end if;

  select * into v_before from public.products
  where id = p_product_id
  for update;
  if not found then raise exception 'Product not found'; end if;
  if v_before.updated_at <> p_expected_updated_at then
    raise exception 'Product changed; reload before retrying';
  end if;
  if v_before.status = 'published' and jsonb_array_length(p_images) = 0 then
    raise exception 'Published products must retain at least one image';
  end if;

  select coalesce(array_agg(trim(image.value)), '{}'::text[])
  into v_images
  from jsonb_array_elements_text(p_images) as image(value);

  update public.products
  set images = v_images, updated_at = now()
  where id = p_product_id
  returning * into v_after;

  insert into public.admin_audit_log (
    actor_user_id, action_type, entity_type, entity_id, previous_value, new_value
  ) values (
    p_actor,
    'RUBI_PRODUCT_MEDIA_IMAGES_UPDATED',
    'product',
    p_product_id::text,
    jsonb_build_object('image_count', cardinality(v_before.images)),
    jsonb_build_object('image_count', cardinality(v_after.images))
  );

  return jsonb_build_object(
    'id', v_after.id,
    'updated_at', v_after.updated_at,
    'image_count', cardinality(v_after.images)
  );
end;
$$;

revoke all on function public.rubi_update_product_images_audited(uuid,jsonb,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.rubi_update_product_images_audited(uuid,jsonb,uuid,timestamptz) to service_role;
