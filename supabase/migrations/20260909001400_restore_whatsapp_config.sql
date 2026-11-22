-- Restore the legacy WhatsApp configuration contract used by Master settings.
-- Credential material is never stored here; only a Supabase Vault reference is allowed.
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id text,
  phone_number_id text,
  access_token_secret_ref text,
  public_phone_number text,
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- This legacy configuration is managed through trusted server-side operations.
-- Do not expose the Vault reference or integration settings to anon/authenticated clients.
REVOKE ALL ON TABLE public.whatsapp_config FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.whatsapp_config TO service_role;

CREATE INDEX IF NOT EXISTS idx_whatsapp_config_updated_at
  ON public.whatsapp_config(updated_at DESC);

COMMENT ON TABLE public.whatsapp_config IS
  'Server-managed WhatsApp integration settings. Access tokens must remain in Supabase Vault; this table stores references only.';
COMMENT ON COLUMN public.whatsapp_config.access_token_secret_ref IS
  'Reference to a Supabase Vault secret; never store the access token itself.';
