#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${RUBI_QA_MASTER_USER_ID:?RUBI_QA_MASTER_USER_ID is required}"
: "${RUBI_QA_CONSUMER_USER_ID:?RUBI_QA_CONSUMER_USER_ID is required}"

master_id="$RUBI_QA_MASTER_USER_ID"
target_id="$RUBI_QA_CONSUMER_USER_ID"

# This script is independently executable: the previous audit smoke is rolled
# back by design, so it must provision its own disposable profiles row.
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v target_id="$target_id" <<'SQL'
INSERT INTO public.profiles (user_id, display_name, is_banned)
VALUES (:'target_id'::uuid, 'RUBI QA Consumidor', false)
ON CONFLICT (user_id) DO NOTHING;
SQL

before="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At \
  -v master_id="$master_id" -v target_id="$target_id" <<'SQL'
SELECT count(*)
  FROM public.admin_audit_log
 WHERE actor_user_id = :'master_id'::uuid
   AND action_type = 'USER_BAN_STATUS_CHANGED'
   AND entity_type = 'profiles'
   AND entity_id = :'target_id';
SQL
)"

run_mutation() {
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
    -v master_id="$master_id" -v target_id="$target_id" <<'SQL'
BEGIN;
SET LOCAL ROLE service_role;
SELECT pg_sleep(0.2);
SELECT public.admin_set_profile_banned(
  :'target_id'::uuid, true, :'master_id'::uuid
);
COMMIT;
SQL
}

run_mutation > /tmp/rubi-user-ban-concurrency-a.log 2>&1 &
pid_a=$!
run_mutation > /tmp/rubi-user-ban-concurrency-b.log 2>&1 &
pid_b=$!

wait "$pid_a" || { cat /tmp/rubi-user-ban-concurrency-a.log; exit 1; }
wait "$pid_b" || { cat /tmp/rubi-user-ban-concurrency-b.log; exit 1; }

after="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At \
  -v master_id="$master_id" -v target_id="$target_id" <<'SQL'
SELECT count(*)
  FROM public.admin_audit_log
 WHERE actor_user_id = :'master_id'::uuid
   AND action_type = 'USER_BAN_STATUS_CHANGED'
   AND entity_type = 'profiles'
   AND entity_id = :'target_id';
SQL
)"

state="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At \
  -v target_id="$target_id" <<'SQL'
SELECT is_banned
  FROM public.profiles
 WHERE user_id = :'target_id'::uuid;
SQL
)"

expected=$((before + 1))
if [[ "$after" -ne "$expected" ]]; then
  echo "Expected exactly one audit event for concurrent identical transitions; before=$before after=$after"
  exit 1
fi
if [[ "$state" != "t" ]]; then
  echo "Expected final user ban state true; got '$state'"
  exit 1
fi

echo "PASS: concurrent identical user-ban requests serialize to one state transition and one audit event."
