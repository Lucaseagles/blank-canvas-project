\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('rubi.qa_master_id', :'master_id', true);
SELECT set_config('rubi.qa_non_owner_id', :'non_owner_id', true);

CREATE TEMP TABLE rubi_qa_telegram_before AS
SELECT
  (SELECT count(*) FROM public.telegram_config) AS config_count,
  (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id), '[]'::jsonb) FROM public.telegram_config t) AS config_rows,
  (SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.platform_id), '[]'::jsonb)
   FROM public.integration_credentials c WHERE c.platform_id='telegram') AS credential_rows,
  (SELECT count(*) FROM vault.secrets) AS vault_secret_count,
  public.get_integration_secret('telegram','channel_id') AS channel_secret,
  public.get_integration_secret('telegram','bot_token') AS bot_secret;
GRANT SELECT ON TABLE pg_temp.rubi_qa_telegram_before TO service_role;

CREATE FUNCTION pg_temp.rubi_qa_reject_telegram_config_audit()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.action_type='RUBI_TELEGRAM_CONFIG_UPDATED' THEN
    RAISE EXCEPTION 'RUBI_QA_FORCED_TELEGRAM_AUDIT_FAILURE';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_reject_telegram_config_audit
BEFORE INSERT ON public.admin_audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.rubi_qa_reject_telegram_config_audit();

SET LOCAL ROLE service_role;
DO $rollback$
DECLARE v_before record;
BEGIN
  SELECT * INTO STRICT v_before FROM pg_temp.rubi_qa_telegram_before;
  BEGIN
    PERFORM public.rubi_save_telegram_config_audited(
      'rubi-qa-rollback-channel', true, 'rubi-qa-rollback-token',
      current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_TELEGRAM_AUDIT_FAILURE_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%RUBI_QA_FORCED_TELEGRAM_AUDIT_FAILURE%' THEN RAISE; END IF;
  END;
  IF (SELECT count(*) FROM public.telegram_config) IS DISTINCT FROM v_before.config_count
    OR (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id), '[]'::jsonb) FROM public.telegram_config t)
      IS DISTINCT FROM v_before.config_rows
    OR (SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.platform_id), '[]'::jsonb)
        FROM public.integration_credentials c WHERE c.platform_id='telegram')
      IS DISTINCT FROM v_before.credential_rows
    OR (SELECT count(*) FROM vault.secrets) IS DISTINCT FROM v_before.vault_secret_count
    OR public.get_integration_secret('telegram','channel_id') IS DISTINCT FROM v_before.channel_secret
    OR public.get_integration_secret('telegram','bot_token') IS DISTINCT FROM v_before.bot_secret THEN
    RAISE EXCEPTION 'Telegram config or Vault state survived failed audit insert';
  END IF;
END;
$rollback$;

RESET ROLE;
DROP TRIGGER rubi_qa_reject_telegram_config_audit ON public.admin_audit_log;
DROP FUNCTION pg_temp.rubi_qa_reject_telegram_config_audit();

SET LOCAL ROLE service_role;
DO $non_owner$
BEGIN
  BEGIN
    PERFORM public.rubi_save_telegram_config_audited(
      'rubi-qa-forbidden-channel', true, 'rubi-qa-forbidden-token',
      current_setting('rubi.qa_non_owner_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_TELEGRAM_NON_OWNER_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Owner authorization required%' THEN RAISE; END IF;
  END;
END;
$non_owner$;

DO $success$
DECLARE v_result jsonb; v_config_id text;
BEGIN
  v_result := public.rubi_save_telegram_config_audited(
    'rubi-qa-success-channel', true, 'rubi-qa-success-token',
    current_setting('rubi.qa_master_id')::uuid
  );
  v_config_id := v_result->>'id';
  IF v_result->>'channel_id' IS DISTINCT FROM 'rubi-qa-success-channel'
    OR v_result->>'is_active' IS DISTINCT FROM 'true'
    OR v_result->>'has_token' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Telegram config RPC returned unexpected result';
  END IF;
  IF public.get_integration_secret('telegram','channel_id') IS DISTINCT FROM 'rubi-qa-success-channel'
    OR public.get_integration_secret('telegram','bot_token') IS DISTINCT FROM 'rubi-qa-success-token' THEN
    RAISE EXCEPTION 'Telegram Vault secrets were not updated together';
  END IF;
  IF (SELECT count(*) FROM public.admin_audit_log
      WHERE action_type='RUBI_TELEGRAM_CONFIG_UPDATED'
        AND entity_type='telegram_config' AND entity_id=v_config_id) <> 1 THEN
    RAISE EXCEPTION 'Telegram config update did not write exactly one audit event';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.admin_audit_log
    WHERE action_type='RUBI_TELEGRAM_CONFIG_UPDATED' AND entity_id=v_config_id
      AND ((coalesce(previous_value,'{}'::jsonb)||coalesce(new_value,'{}'::jsonb))::text
        LIKE '%rubi-qa-success-channel%'
        OR (coalesce(previous_value,'{}'::jsonb)||coalesce(new_value,'{}'::jsonb))::text
        LIKE '%rubi-qa-success-token%')
  ) THEN
    RAISE EXCEPTION 'Telegram audit contains a secret or channel identifier';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.admin_audit_log
    WHERE action_type='RUBI_TELEGRAM_CONFIG_UPDATED' AND entity_id=v_config_id
      AND (coalesce(previous_value->>'values_redacted','false') <> 'true'
        OR coalesce(new_value->>'channel_id_redacted','false') <> 'true'
        OR coalesce(new_value->>'bot_token_redacted','false') <> 'true')
  ) THEN
    RAISE EXCEPTION 'Telegram audit is missing explicit redaction markers';
  END IF;
  BEGIN
    PERFORM public.rubi_update_admin_setting_audited(
      'telegram_config', v_config_id::uuid,
      jsonb_build_object('channel_id','rubi-qa-generic-bypass'),
      jsonb_build_object('channel_id','rubi-qa-success-channel'),
      current_setting('rubi.qa_master_id')::uuid
    );
    RAISE EXCEPTION 'RUBI_QA_EXPECTED_GENERIC_TELEGRAM_WRITE_REJECTION_NOT_RAISED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Unknown configuration source%' THEN RAISE; END IF;
  END;
END;
$success$;

DO $grants$
BEGIN
  IF NOT has_function_privilege('service_role',
    'public.rubi_save_telegram_config_audited(text,boolean,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute Telegram config audit RPC';
  END IF;
  IF has_function_privilege('anon',
    'public.rubi_save_telegram_config_audited(text,boolean,text,uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated',
    'public.rubi_save_telegram_config_audited(text,boolean,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Untrusted API role can execute Telegram config audit RPC';
  END IF;
END;
$grants$;

ROLLBACK;
\echo 'PASS: Telegram config + Vault updates are atomic, Owner-only, serialized and audited with redacted values.'
