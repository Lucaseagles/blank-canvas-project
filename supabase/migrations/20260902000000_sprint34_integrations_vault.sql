-- Sprint 34 — real platform integrations
-- Secrets are stored in Supabase Vault. Public/client roles never receive secret values.

CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id TEXT NOT NULL UNIQUE,
  secret_refs JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error')),
  last_checked_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

-- This metadata table is server-only. No anon/authenticated Data API access.
REVOKE ALL ON TABLE public.integration_credentials FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.integration_credentials TO service_role;

CREATE INDEX IF NOT EXISTS idx_integration_credentials_platform
  ON public.integration_credentials(platform_id);

CREATE OR REPLACE FUNCTION public.set_integration_secret(
  p_platform_id TEXT,
  p_field_key TEXT,
  p_value TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  refs JSONB;
  existing_ref TEXT;
  secret_id UUID;
  secret_name TEXT := 'integration:' || p_platform_id || ':' || p_field_key;
  description TEXT := 'Sprint 34 integration secret for ' || p_platform_id || '.' || p_field_key;
BEGIN
  IF p_platform_id IS NULL OR p_field_key IS NULL OR p_value IS NULL OR length(trim(p_value)) = 0 THEN
    RAISE EXCEPTION 'Invalid integration secret payload';
  END IF;

  SELECT secret_refs INTO refs
  FROM public.integration_credentials
  WHERE platform_id = p_platform_id
  FOR UPDATE;

  existing_ref := refs ->> p_field_key;

  IF existing_ref IS NOT NULL AND existing_ref <> '' THEN
    secret_id := existing_ref::UUID;
    PERFORM vault.update_secret(secret_id, p_value, secret_name, description);
  ELSE
    secret_id := vault.create_secret(p_value, secret_name, description);
  END IF;

  INSERT INTO public.integration_credentials (platform_id, secret_refs, status, updated_at)
  VALUES (
    p_platform_id,
    jsonb_build_object(p_field_key, secret_id::TEXT),
    'pending',
    NOW()
  )
  ON CONFLICT (platform_id) DO UPDATE
  SET secret_refs = public.integration_credentials.secret_refs || jsonb_build_object(p_field_key, secret_id::TEXT),
      status = 'pending',
      last_error = NULL,
      updated_at = NOW();

  RETURN secret_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_integration_secret(
  p_platform_id TEXT,
  p_field_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_ref TEXT;
  secret_value TEXT;
BEGIN
  SELECT secret_refs ->> p_field_key INTO secret_ref
  FROM public.integration_credentials
  WHERE platform_id = p_platform_id;

  IF secret_ref IS NULL OR secret_ref = '' THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE id = secret_ref::UUID;

  RETURN secret_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_integration_secret(
  p_platform_id TEXT,
  p_field_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  refs JSONB;
  secret_ref TEXT;
BEGIN
  SELECT secret_refs INTO refs
  FROM public.integration_credentials
  WHERE platform_id = p_platform_id
  FOR UPDATE;

  secret_ref := refs ->> p_field_key;

  IF secret_ref IS NULL OR secret_ref = '' THEN
    RETURN FALSE;
  END IF;

  PERFORM vault.delete_secret(secret_ref::UUID);

  UPDATE public.integration_credentials
  SET secret_refs = secret_refs - p_field_key,
      status = 'pending',
      last_error = NULL,
      updated_at = NOW()
  WHERE platform_id = p_platform_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_integration_check(
  p_platform_id TEXT,
  p_status TEXT,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('pending', 'active', 'error') THEN
    RAISE EXCEPTION 'Invalid integration status';
  END IF;

  INSERT INTO public.integration_credentials (platform_id, status, last_checked_at, last_error, updated_at)
  VALUES (p_platform_id, p_status, NOW(), p_error, NOW())
  ON CONFLICT (platform_id) DO UPDATE
  SET status = EXCLUDED.status,
      last_checked_at = EXCLUDED.last_checked_at,
      last_error = EXCLUDED.last_error,
      updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.set_integration_secret(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_integration_secret(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_integration_secret(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_integration_check(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_integration_secret(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_integration_secret(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_integration_secret(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_integration_check(TEXT, TEXT, TEXT) TO service_role;

COMMENT ON TABLE public.integration_credentials IS 'Server-only integration metadata. Secret values live in Supabase Vault.';
COMMENT ON COLUMN public.integration_credentials.secret_refs IS 'Maps credential field keys to Vault secret UUIDs; never contains secret values.';
