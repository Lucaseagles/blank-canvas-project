-- Sprint 34 Part 2 — expanded Secure Hub registry.
-- These entries are metadata only. No platform is treated as live until its official
-- API/authentication, eligibility and policy requirements are validated.

INSERT INTO public.integration_platforms (id, name, category, lifecycle_status, capabilities, rules)
VALUES
  ('shein', 'Shein', 'marketplace', 'pending', '{"product":true,"affiliate":true,"api":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('temu', 'Temu', 'marketplace', 'pending', '{"product":true,"affiliate":true,"api":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('magalu', 'Magalu', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('americanas', 'Americanas', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('casas_bahia', 'Casas Bahia', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('netshoes', 'Netshoes', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('dafiti', 'Dafiti', 'marketplace', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('hotmart', 'Hotmart', 'affiliate', 'pending', '{"product":true,"affiliate":true,"video":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('kianda', 'Kianda', 'affiliate', 'pending', '{"affiliate":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('eduzz', 'Eduzz', 'affiliate', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('monetizze', 'Monetizze', 'affiliate', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('pepo', 'Pepo', 'affiliate', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('lomadee', 'Lomadee', 'affiliate', 'pending', '{"product":true,"affiliate":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('youtube_shopping', 'YouTube Shopping', 'video', 'pending', '{"product":true,"affiliate":true,"video":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('instagram_shopping', 'Instagram Shopping', 'video', 'pending', '{"product":true,"affiliate":true,"video":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('facebook_shops', 'Facebook Shops', 'video', 'pending', '{"product":true,"video":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('pinterest_shopping', 'Pinterest Shopping', 'video', 'pending', '{"product":true,"video":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('reels_shopping', 'Reels Shopping (Meta)', 'video', 'pending', '{"product":true,"affiliate":true,"video":true}'::jsonb, '{"validationRequired":true}'::jsonb),
  ('instagram_dms', 'Instagram DMs', 'communication', 'pending', '{"messaging":true}'::jsonb, '{"validationRequired":true,"optIn":true}'::jsonb),
  ('facebook_messenger', 'Facebook Messenger', 'communication', 'pending', '{"messaging":true}'::jsonb, '{"validationRequired":true,"optIn":true}'::jsonb),
  ('twilio_sms', 'SMS (Twilio)', 'communication', 'pending', '{"messaging":true,"sms":true}'::jsonb, '{"validationRequired":true,"optIn":true}'::jsonb),
  ('email_marketing', 'Email Marketing', 'communication', 'pending', '{"messaging":true,"email":true}'::jsonb, '{"validationRequired":true,"optIn":true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, lifecycle_status = EXCLUDED.lifecycle_status, capabilities = EXCLUDED.capabilities, rules = EXCLUDED.rules, updated_at = NOW();

INSERT INTO public.integration_credential_fields (platform_id, field_key, label, field_type, required)
VALUES
  ('shein', 'affiliate_id', 'Affiliate ID', 'text', TRUE), ('shein', 'tracking_id', 'Tracking ID', 'text', TRUE),
  ('temu', 'affiliate_id', 'Affiliate ID', 'text', TRUE),
  ('hotmart', 'affiliate_id', 'Affiliate ID', 'text', TRUE), ('hotmart', 'api_token', 'API Token', 'password', TRUE),
  ('youtube_shopping', 'channel_id', 'Channel ID', 'text', TRUE), ('youtube_shopping', 'api_key', 'API Key', 'password', TRUE),
  ('instagram_shopping', 'business_id', 'Business ID', 'text', TRUE), ('instagram_shopping', 'access_token', 'Access Token', 'password', TRUE),
  ('instagram_dms', 'access_token', 'Access Token', 'password', TRUE),
  ('facebook_messenger', 'access_token', 'Access Token', 'password', TRUE),
  ('twilio_sms', 'account_sid', 'Account SID', 'text', TRUE), ('twilio_sms', 'auth_token', 'Auth Token', 'password', TRUE), ('twilio_sms', 'from_number', 'From Number', 'text', TRUE),
  ('email_marketing', 'provider', 'Provider', 'text', TRUE), ('email_marketing', 'api_key', 'API Key', 'password', TRUE)
ON CONFLICT (platform_id, field_key) DO UPDATE SET label = EXCLUDED.label, field_type = EXCLUDED.field_type, required = EXCLUDED.required;

-- Keep one metadata row per newly registered platform; secret values remain in Vault.
INSERT INTO public.integration_credentials (platform_id)
SELECT id FROM public.integration_platforms
WHERE id IN ('shein','temu','magalu','americanas','casas_bahia','netshoes','dafiti','hotmart','kianda','eduzz','monetizze','pepo','lomadee','youtube_shopping','instagram_shopping','facebook_shops','pinterest_shopping','reels_shopping','instagram_dms','facebook_messenger','twilio_sms','email_marketing')
ON CONFLICT (platform_id) DO NOTHING;
