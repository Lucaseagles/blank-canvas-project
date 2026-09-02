-- Sprint 34 — extensible platform registry
-- This migration extends the existing Vault-backed credential layer without storing secret values in public tables.

CREATE TABLE IF NOT EXISTS public.integration_platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('marketplace', 'affiliate', 'video', 'communication', 'compliance')),
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('available', 'pending', 'inactive', 'blocked', 'external_traffic')),
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integration_credential_fields (
  platform_id TEXT NOT NULL REFERENCES public.integration_platforms(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'password', 'select', 'textarea')),
  required BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (platform_id, field_key)
);

ALTER TABLE public.integration_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_credential_fields ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.integration_platforms FROM anon, authenticated;
REVOKE ALL ON TABLE public.integration_credential_fields FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.integration_platforms TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.integration_credential_fields TO service_role;

INSERT INTO public.integration_platforms (id, name, category, lifecycle_status, capabilities, rules)
VALUES
  ('tiktok_shop', 'TikTok Shop', 'marketplace', 'external_traffic', '{"product":true,"affiliate":true,"video":true,"externalTraffic":true}'::jsonb, '{"requiresContentAuthorization":true}'::jsonb),
  ('shopee', 'Shopee', 'marketplace', 'available', '{"product":true,"affiliate":true}'::jsonb, '{}'::jsonb),
  ('kwai', 'Kwai / Kwai Shop', 'video', 'pending', '{"product":true,"video":true}'::jsonb, '{"shopEligibility":"validate"}'::jsonb),
  ('mercadolivre', 'Mercado Livre', 'marketplace', 'available', '{"product":true,"affiliate":true,"oauth":true}'::jsonb, '{}'::jsonb),
  ('aliexpress', 'AliExpress', 'marketplace', 'available', '{"product":true,"affiliate":true,"api":true}'::jsonb, '{}'::jsonb),
  ('amazon', 'Amazon', 'marketplace', 'available', '{"product":true,"affiliate":true,"api":true}'::jsonb, '{}'::jsonb),
  ('whatsapp', 'WhatsApp Business', 'communication', 'available', '{"messaging":true}'::jsonb, '{"optIn":true,"templateApproval":true}'::jsonb),
  ('telegram', 'Telegram', 'communication', 'available', '{"messaging":true}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, lifecycle_status = EXCLUDED.lifecycle_status, capabilities = EXCLUDED.capabilities, rules = EXCLUDED.rules, updated_at = NOW();

INSERT INTO public.integration_credential_fields (platform_id, field_key, label, field_type, required)
VALUES
  ('tiktok_shop', 'partner_id', 'Partner ID', 'text', TRUE), ('tiktok_shop', 'affiliate_id', 'Affiliate ID', 'text', TRUE),
  ('shopee', 'partner_id', 'Partner ID', 'text', TRUE), ('shopee', 'partner_key', 'Partner Key', 'password', TRUE), ('shopee', 'affiliate_id', 'Affiliate ID', 'text', TRUE),
  ('kwai', 'api_key', 'API Key', 'password', FALSE),
  ('mercadolivre', 'client_id', 'Client ID', 'text', TRUE), ('mercadolivre', 'client_secret', 'Client Secret', 'password', TRUE), ('mercadolivre', 'affiliate_id', 'Affiliate ID', 'text', TRUE),
  ('aliexpress', 'app_key', 'App Key', 'text', TRUE), ('aliexpress', 'app_secret', 'App Secret', 'password', TRUE), ('aliexpress', 'tracking_id', 'Tracking ID', 'text', TRUE),
  ('amazon', 'access_key', 'Access Key', 'text', TRUE), ('amazon', 'secret_key', 'Secret Key', 'password', TRUE), ('amazon', 'associate_id', 'Associate ID', 'text', TRUE),
  ('whatsapp', 'business_account_id', 'Business Account ID', 'text', TRUE), ('whatsapp', 'phone_number_id', 'Phone Number ID', 'text', TRUE), ('whatsapp', 'access_token', 'Access Token', 'password', TRUE),
  ('telegram', 'bot_token', 'Bot Token', 'password', TRUE), ('telegram', 'channel_id', 'Channel ID', 'text', FALSE)
ON CONFLICT (platform_id, field_key) DO UPDATE SET label = EXCLUDED.label, field_type = EXCLUDED.field_type, required = EXCLUDED.required;

-- Remove the old five-platform restriction and make credentials depend on the registry.
ALTER TABLE public.integration_credentials DROP CONSTRAINT IF EXISTS integration_credentials_platform_id_check;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'integration_credentials_platform_id_fkey' AND conrelid = 'public.integration_credentials'::regclass) THEN
    ALTER TABLE public.integration_credentials ADD CONSTRAINT integration_credentials_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.integration_platforms(id);
  END IF;
END $$;

-- Keep one metadata row per registered platform. Secret values remain in Vault.
INSERT INTO public.integration_credentials (platform_id)
SELECT id FROM public.integration_platforms
ON CONFLICT (platform_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_integration_platforms_category ON public.integration_platforms(category);
CREATE INDEX IF NOT EXISTS idx_integration_platforms_status ON public.integration_platforms(lifecycle_status);

CREATE OR REPLACE FUNCTION public.set_integration_secret(p_platform_id TEXT, p_field_key TEXT, p_value TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, vault AS $$
DECLARE refs JSONB; existing_ref TEXT; secret_id UUID; secret_name TEXT := 'integration:' || p_platform_id || ':' || p_field_key; description TEXT := 'Integration secret for ' || p_platform_id || '.' || p_field_key;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.integration_platforms WHERE id = p_platform_id AND active) THEN RAISE EXCEPTION 'Invalid or inactive integration platform'; END IF;
  IF p_field_key IS NULL OR p_value IS NULL OR length(trim(p_value)) = 0 THEN RAISE EXCEPTION 'Invalid integration secret payload'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.integration_credential_fields WHERE platform_id = p_platform_id AND field_key = p_field_key) THEN RAISE EXCEPTION 'Invalid credential field for integration platform'; END IF;
  SELECT secret_refs INTO refs FROM public.integration_credentials WHERE platform_id = p_platform_id FOR UPDATE;
  existing_ref := COALESCE(refs, '{}'::jsonb) ->> p_field_key;
  IF existing_ref IS NOT NULL AND existing_ref <> '' THEN secret_id := existing_ref::UUID; PERFORM vault.update_secret(secret_id, p_value, secret_name, description); ELSE secret_id := vault.create_secret(p_value, secret_name, description); END IF;
  INSERT INTO public.integration_credentials (platform_id, secret_refs, status, updated_at) VALUES (p_platform_id, jsonb_build_object(p_field_key, secret_id::TEXT), 'pending', NOW()) ON CONFLICT (platform_id) DO UPDATE SET secret_refs = public.integration_credentials.secret_refs || jsonb_build_object(p_field_key, secret_id::TEXT), status = 'pending', last_error = NULL, updated_at = NOW();
  RETURN secret_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_integration_secret(p_platform_id TEXT, p_field_key TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, vault AS $$
DECLARE secret_ref TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.integration_platforms WHERE id = p_platform_id AND active) THEN RAISE EXCEPTION 'Invalid or inactive integration platform'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.integration_credential_fields WHERE platform_id = p_platform_id AND field_key = p_field_key) THEN RAISE EXCEPTION 'Invalid credential field for integration platform'; END IF;
  SELECT secret_refs ->> p_field_key INTO secret_ref FROM public.integration_credentials WHERE platform_id = p_platform_id;
  IF secret_ref IS NULL OR secret_ref = '' THEN RETURN NULL; END IF;
  RETURN (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = secret_ref::UUID);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_integration_check(p_platform_id TEXT, p_status TEXT, p_error TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.integration_platforms WHERE id = p_platform_id) THEN RAISE EXCEPTION 'Invalid integration platform'; END IF;
  IF p_status NOT IN ('pending', 'active', 'error') THEN RAISE EXCEPTION 'Invalid integration status'; END IF;
  INSERT INTO public.integration_credentials (platform_id, status, last_checked_at, last_error, updated_at) VALUES (p_platform_id, p_status, NOW(), p_error, NOW()) ON CONFLICT (platform_id) DO UPDATE SET status = EXCLUDED.status, last_checked_at = EXCLUDED.last_checked_at, last_error = EXCLUDED.last_error, updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.set_integration_secret(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_integration_secret(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_integration_check(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_integration_secret(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_integration_secret(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_integration_check(TEXT, TEXT, TEXT) TO service_role;
