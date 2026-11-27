#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${RUBI_QA_MASTER_USER_ID:?RUBI_QA_MASTER_USER_ID is required}"

actor_id="$RUBI_QA_MASTER_USER_ID"
rule_id="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At <<'SQL'
SELECT id
  FROM public.automation_rules
 WHERE action_type::text='RECALCULATE_TRENDING'
   AND is_active=true
 ORDER BY created_at,id
 LIMIT 1;
SQL
)"
: "${rule_id:?Active trending rule is required}"

before="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At -v actor_id="$actor_id" -v rule_id="$rule_id" <<'SQL'
SELECT count(*)
  FROM public.admin_audit_log
 WHERE actor_user_id=:'actor_id'::uuid
   AND action_type='RUBI_AUTOMATION_TRENDING_RECALCULATED'
   AND entity_id::text=:'rule_id';
SQL
)"

run_refresh() {
  local result
  result="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -qAt -v actor_id="$actor_id" <<'SQL'
BEGIN;
SET LOCAL ROLE service_role;
SELECT public.rubi_recalculate_trending_audited(:'actor_id'::uuid);
COMMIT;
SQL
)"
  if [[ "$result" != *'"success": true'* ]]; then
    echo "Manual trending refresh did not succeed: $result"
    return 1
  fi
}

run_refresh > /tmp/rubi-trending-concurrency-a.log 2>&1 &
pid_a=$!
run_refresh > /tmp/rubi-trending-concurrency-b.log 2>&1 &
pid_b=$!
wait "$pid_a" || { cat /tmp/rubi-trending-concurrency-a.log; exit 1; }
wait "$pid_b" || { cat /tmp/rubi-trending-concurrency-b.log; exit 1; }

after="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At -v actor_id="$actor_id" -v rule_id="$rule_id" <<'SQL'
SELECT count(*)
  FROM public.admin_audit_log
 WHERE actor_user_id=:'actor_id'::uuid
   AND action_type='RUBI_AUTOMATION_TRENDING_RECALCULATED'
   AND entity_id::text=:'rule_id';
SQL
)"

if [[ "$after" -ne "$((before + 2))" ]]; then
  echo "Expected two serialized manual trending audit events; before=$before after=$after"
  exit 1
fi

echo "PASS: concurrent manual trending requests serialize and each persist one atomic audit event."
