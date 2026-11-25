#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${RUBI_QA_MASTER_USER_ID:?RUBI_QA_MASTER_USER_ID is required}"

fixture_name="RUBI QA pause concurrency ${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
id_file="$(mktemp)"
first_out="$(mktemp)"
second_out="$(mktemp)"
first_err="$(mktemp)"
second_err="$(mktemp)"
cleanup() {
  if [[ -s "$id_file" ]]; then
    orchestration_id="$(cat "$id_file")"
    psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v orchestration_id="$orchestration_id" <<'SQL' >/dev/null 2>&1 || true
DROP TRIGGER IF EXISTS rubi_qa_pause_delay ON public.strategy_orchestrations;
DROP FUNCTION IF EXISTS public.rubi_qa_pause_delay();
DELETE FROM public.admin_audit_log
 WHERE entity_type = 'strategy_orchestration'
   AND entity_id = :'orchestration_id'
   AND action_type = 'RUBI_STRATEGY_ORCHESTRATION_PAUSED';
DELETE FROM public.strategy_orchestrations WHERE id = :'orchestration_id';
SQL
  fi
  rm -f "$id_file" "$first_out" "$second_out" "$first_err" "$second_err"
}
trap cleanup EXIT

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
  -v master_id="$RUBI_QA_MASTER_USER_ID" \
  -v fixture_name="$fixture_name" <<'SQL' > "$id_file"
SET ROLE service_role;
INSERT INTO public.strategy_orchestrations(name, objective, status, priority, created_by)
VALUES (:'fixture_name', 'concurrency', 'ready', 50, :'master_id')
RETURNING id;
RESET ROLE;
SQL
orchestration_id="$(grep -Eo '[0-9a-f]{8}-[0-9a-f-]{27,}' "$id_file" | head -n1)"
if [[ -z "$orchestration_id" ]]; then
  echo "Could not create the disposable orchestration fixture." >&2
  exit 1
fi
printf '%s' "$orchestration_id" > "$id_file"

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v orchestration_id="$orchestration_id" <<'SQL'
CREATE OR REPLACE FUNCTION public.rubi_qa_pause_delay()
RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.id = TG_ARGV[0]::uuid THEN
    PERFORM pg_sleep(2);
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER rubi_qa_pause_delay
BEFORE UPDATE ON public.strategy_orchestrations
FOR EACH ROW EXECUTE FUNCTION public.rubi_qa_pause_delay(:'orchestration_id');
SQL

set +e
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v orchestration_id="$orchestration_id" -v master_id="$RUBI_QA_MASTER_USER_ID" \
  -c "SET ROLE service_role; SELECT public.rubi_pause_strategy_orchestration_audited(:'orchestration_id', :'master_id');" >"$first_out" 2>"$first_err" &
first_pid=$!
sleep 0.2
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v orchestration_id="$orchestration_id" -v master_id="$RUBI_QA_MASTER_USER_ID" \
  -c "SET ROLE service_role; SELECT public.rubi_pause_strategy_orchestration_audited(:'orchestration_id', :'master_id');" >"$second_out" 2>"$second_err" &
second_pid=$!
wait "$first_pid"
first_status=$?
wait "$second_pid"
second_status=$?
set -e

successes=$(( (first_status == 0) + (second_status == 0) ))
failures=$(( (first_status != 0) + (second_status != 0) ))
if [[ "$successes" -ne 1 || "$failures" -ne 1 ]]; then
  echo "Expected exactly one concurrent pause success and one rejection; got statuses $first_status/$second_status." >&2
  cat "$first_err" "$second_err" >&2
  exit 1
fi

if ! grep -Eqi "cannot be paused from current status" "$first_err" "$second_err"; then
  echo "The losing concurrent request did not fail due to the rechecked paused state." >&2
  cat "$first_err" "$second_err" >&2
  exit 1
fi

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v orchestration_id="$orchestration_id" <<'SQL'
DO $assert$
BEGIN
  IF (SELECT status FROM public.strategy_orchestrations WHERE id = :'orchestration_id') <> 'paused' THEN
    RAISE EXCEPTION 'Concurrent pause did not leave the orchestration paused';
  END IF;
  IF (SELECT count(*) FROM public.admin_audit_log
      WHERE entity_type = 'strategy_orchestration'
        AND entity_id = :'orchestration_id'
        AND action_type = 'RUBI_STRATEGY_ORCHESTRATION_PAUSED') <> 1 THEN
    RAISE EXCEPTION 'Concurrent pause must create exactly one audit event';
  END IF;
END;
$assert$;
SQL

echo "PASS: concurrent pause serialized; exactly one transition and one audit event."
