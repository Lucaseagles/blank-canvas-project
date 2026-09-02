-- Sprint 34 Part 3 — synchronize the database registry with the expanded Secure Hub.
-- No credential values are stored here. This migration only registers platform metadata/fields.

INSERT INTO public.integration_platforms (id, name, category, lifecycle_status, capabilities, rules, active)
VALUES
  ('shein', 'Shein', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('temu', 'Temu', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('magalu', 'Magalu', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('americanas', 'Americanas', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('casas_bahia', 'Casas Bahia', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('netshoes', 'Netshoes', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('dafiti', 'Dafiti', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('hotmart', 'Hotmart', 'affiliate', 'pending', '{"product":true,"affiliate":true,"video":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('kianda', 'Kianda', 'affiliate', 'pending', '{"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('eduzz', 'Eduzz', 'affiliate', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('monetizze', 'Monetizze', 'affiliate', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('pepo', 'Pepo', 'affiliate', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('lomadee', 'Lomadee', 'affiliate', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validation":"required"}'::jsonb, true),
  ('youtube_shopping', 'YouTube Shopping', 'video', 'pending', '{"video":true,"product":true,"affiliate":true}'::jsonb, '{"authorization":"required"}'::jsonb, true),
  ('instagram_shopping', 'Instagram Shopping', 'video', 'pending', '{"video":true,"product":true,"affiliate":true}'::jsonb, '{"authorization":"required"}'::jsonb, true),
  ('facebook_shops', 'Facebook Shops', 'video', 'pending', '{"product":true}'::jsonb, '{"authorization":"required"}'::jsonb, true),
  ('pinterest_shopping', 'Pinterest Shopping', 'video', 'pending', '{"product":true}'::jsonb, '{"authorization":"required"}'::jsonb, true),
  ('reels_shopping', 'Reels Shopping', 'video', 'pending', '{"video":true,"product":true}'::jsonb, '{"authorization":"required"}'::jsonb, true),
  ('instagram_dms', 'Instagram DMs', 'communication', 'pending', '{"messaging":true}'::jsonb, '{"optIn":true}'::jsonb, true),
  ('facebook_messenger', 'Facebook Messenger', 'communication', 'pending', '{"messaging":true}'::jsonb, '{"optIn":true}'::jsonb, true),
  ('twilio_sms', 'SMS (Twilio)', 'communication', 'pending', '{"messaging":true}'::jsonb, '{"optIn":true}'::jsonb, true),
  ('email_marketing', 'Email Marketing', 'communication', 'pending', '{"messaging":true}'::jsonb, '{"optIn":true}'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, lifecycle_status = EXCLUDED.lifecycle_status, capabilities = EXCLUDED.capabilities, rules = EXCLUDED.rules, active = EXCLUDED.active, updated_at = NOW();

INSERT INTO public.integration_credential_fields (platform_id, field_key, label, field_type, required)
VALUES
  ('shein', 'affiliate_id', 'Affiliate ID', 'text', true),
  ('shein', 'tracking_id', 'Tracking ID', 'text', true),
  ('temu', 'affiliate_id', 'Affiliate ID', 'text', true),
  ('hotmart', 'affiliate_id', 'Affiliate ID', 'text', true),
  ('hotmart', 'api_token', 'API Token', 'password', true)
ON CONFLICT (platform_id, field_key) DO UPDATE SET label = EXCLUDED.label, field_type = EXCLUDED.field_type, required = EXCLUDED.required;

-- Ensure every registered platform has exactly one metadata row in the credential table.
INSERT INTO public.integration_credentials (platform_id)
SELECT id FROM public.integration_platforms WHERE active
ON CONFLICT (platform_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_integration_credentials_status_checked
  ON public.integration_credentials(status, last_checked_at);

COMMENT ON TABLE public.integration_platforms IS 'Owner Secure Hub platform registry; secret values never belong in this table.';
COMMENT ON TABLE public.integration_credentials IS 'Owner Secure Hub credential metadata and Vault secret references; plaintext secrets are not stored here.';
