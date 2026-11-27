\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  category_id uuid;
  product_id uuid;
BEGIN
  SELECT id INTO category_id FROM public.categories ORDER BY id LIMIT 1;
  SELECT id INTO product_id FROM public.products
  WHERE status IN ('active', 'published') ORDER BY id LIMIT 1;
  IF category_id IS NULL OR product_id IS NULL THEN
    RAISE EXCEPTION 'RLS smoke requires at least one category and one active/published product fixture';
  END IF;
  PERFORM set_config('rubi.smoke.category_id', category_id::text, true);
  PERFORM set_config('rubi.smoke.product_id', product_id::text, true);
END
$$;

-- Seed a row owned by another profile using the disposable database owner.
INSERT INTO public.user_interests (user_id, category_id, score)
VALUES (:'merchant_id'::uuid, current_setting('rubi.smoke.category_id')::uuid, 7)
ON CONFLICT (user_id, category_id) DO UPDATE SET score = EXCLUDED.score;
INSERT INTO public.favorites (user_id, product_id)
VALUES (:'merchant_id'::uuid, current_setting('rubi.smoke.product_id')::uuid)
ON CONFLICT DO NOTHING;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :'consumer_id', true);
SELECT set_config('rubi.smoke.consumer_id', :'consumer_id', true);
SELECT set_config('rubi.smoke.merchant_id', :'merchant_id', true);

DO $$
DECLARE
  own_interest_inserted integer := 0;
  cross_interest_inserted boolean := false;
  cross_interest_updated integer := 0;
  own_favorite_inserted integer := 0;
  cross_favorite_inserted boolean := false;
  cross_favorite_updated integer := 0;
BEGIN
  INSERT INTO public.user_interests (user_id, category_id, score)
  VALUES (auth.uid(), current_setting('rubi.smoke.category_id')::uuid, 3);
  GET DIAGNOSTICS own_interest_inserted = ROW_COUNT;
  IF own_interest_inserted <> 1 THEN
    RAISE EXCEPTION 'Authenticated user could not insert own interest';
  END IF;

  BEGIN
    INSERT INTO public.user_interests (user_id, category_id, score)
    VALUES (current_setting('rubi.smoke.merchant_id')::uuid, current_setting('rubi.smoke.category_id')::uuid, 99);
  EXCEPTION WHEN insufficient_privilege THEN
    cross_interest_inserted := true;
  END;
  IF NOT cross_interest_inserted THEN
    RAISE EXCEPTION 'Authenticated user inserted an interest for another profile';
  END IF;

  UPDATE public.user_interests SET score = score + 1
  WHERE user_id = current_setting('rubi.smoke.merchant_id')::uuid
    AND category_id = current_setting('rubi.smoke.category_id')::uuid;
  GET DIAGNOSTICS cross_interest_updated = ROW_COUNT;
  IF cross_interest_updated <> 0 THEN
    RAISE EXCEPTION 'Authenticated user updated another profile interest';
  END IF;

  INSERT INTO public.favorites (user_id, product_id)
  VALUES (auth.uid(), current_setting('rubi.smoke.product_id')::uuid);
  GET DIAGNOSTICS own_favorite_inserted = ROW_COUNT;
  IF own_favorite_inserted <> 1 THEN
    RAISE EXCEPTION 'Authenticated user could not insert own favorite';
  END IF;

  BEGIN
    INSERT INTO public.favorites (user_id, product_id)
    VALUES (current_setting('rubi.smoke.merchant_id')::uuid, current_setting('rubi.smoke.product_id')::uuid);
  EXCEPTION WHEN insufficient_privilege THEN
    cross_favorite_inserted := true;
  END;
  IF NOT cross_favorite_inserted THEN
    RAISE EXCEPTION 'Authenticated user inserted a favorite for another profile';
  END IF;

  UPDATE public.favorites SET product_id = current_setting('rubi.smoke.product_id')::uuid
  WHERE user_id = current_setting('rubi.smoke.merchant_id')::uuid
    AND product_id = current_setting('rubi.smoke.product_id')::uuid;
  GET DIAGNOSTICS cross_favorite_updated = ROW_COUNT;
  IF cross_favorite_updated <> 0 THEN
    RAISE EXCEPTION 'Authenticated user updated another profile favorite';
  END IF;
END
$$;

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);

DO $$
DECLARE
  anon_interest_denied boolean := false;
  anon_favorite_denied boolean := false;
BEGIN
  BEGIN
    INSERT INTO public.user_interests (user_id, category_id, score)
    VALUES (current_setting('rubi.smoke.consumer_id')::uuid, current_setting('rubi.smoke.category_id')::uuid, 500);
  EXCEPTION WHEN insufficient_privilege THEN
    anon_interest_denied := true;
  END;
  IF NOT anon_interest_denied THEN
    RAISE EXCEPTION 'Anonymous client wrote user_interests';
  END IF;

  BEGIN
    INSERT INTO public.favorites (user_id, product_id)
    VALUES (current_setting('rubi.smoke.consumer_id')::uuid, current_setting('rubi.smoke.product_id')::uuid);
  EXCEPTION WHEN insufficient_privilege THEN
    anon_favorite_denied := true;
  END;
  IF NOT anon_favorite_denied THEN
    RAISE EXCEPTION 'Anonymous client wrote favorites';
  END IF;
END
$$;

ROLLBACK;
SELECT 'user_interests and favorites per-user RLS, anonymous write denial and cross-profile isolation: PASS' AS result;
