#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${RUBI_QA_MASTER_USER_ID:?RUBI_QA_MASTER_USER_ID is required}"
: "${RUBI_QA_CONSUMER_USER_ID:?RUBI_QA_CONSUMER_USER_ID is required}"

master_id="$RUBI_QA_MASTER_USER_ID"
target_id="$RUBI_QA_CONSUMER_USER_ID"

# The database is disposable. Start from a known state and count only events
# produced by this concurrency probe.
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v target_id="$target_id" <<'SQL'
UPDATE public.profiles
   SET is_banned = false
 WHERE user_id = :'target_id'::uuid;
SQL

before="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At   -v master_id="$master_id" -v target_id="$target_id"   -c "select count(*) from public.admin_audit_log
       where actor_user_id = :'master_id'::uuid
         and action_type = 'USER_BAN_STATUS_CHANGED'
         and entity_type = 'profiles'
         and entity_id = :'target_id';")"

run_mutation() {
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1     -v master_id="$master_id" -v target_id="$target_id" <<'SQL'
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

after="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At   -v master_id="$master_id" -v target_id="$target_id"   -c "select count(*) from public.admin_audit_log
       where actor_user_id = :'master_id'::uuid
         and action_type = 'USER_BAN_STATUS_CHANGED'
         and entity_type = 'profiles'
         and entity_id = :'target_id';")"

state="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At   -v target_id="$target_id"   -c "select is_banned from public.profiles where user_id = :'target_id'::uuid;")"

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
