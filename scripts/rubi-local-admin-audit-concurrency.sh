#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${RUBI_QA_MASTER_USER_ID:?RUBI_QA_MASTER_USER_ID is required}"

psql_base=(psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1)
video_id="$("${psql_base[@]}" -qAt -v master_id="$RUBI_QA_MASTER_USER_ID" <<'SQL'
SELECT public.rubi_manage_video_audited(
  'save', NULL,
  jsonb_build_object('title', 'RUBI QA concurrent ' || gen_random_uuid()::text,
    'status', 'draft', 'external_url', 'https://example.test/rubi-qa-concurrency.mp4'),
  '[]'::jsonb, :'master_id'::uuid
)->>'id';
SQL
)"

if [[ ! "$video_id" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  echo "Could not create disposable video for concurrency test" >&2
  exit 1
fi

cleanup() {
  "${psql_base[@]}" -v video_id="$video_id" -v master_id="$RUBI_QA_MASTER_USER_ID" >/dev/null <<'SQL' || true
SELECT public.rubi_manage_video_audited('delete', :'video_id'::uuid, '{}'::jsonb, NULL, :'master_id'::uuid);
SQL
}

tmp_dir="$(mktemp -d)"
trap 'cleanup; rm -rf "$tmp_dir"' EXIT

"${psql_base[@]}" -v video_id="$video_id" -v master_id="$RUBI_QA_MASTER_USER_ID" >"$tmp_dir/session-a.log" 2>&1 <<'SQL' &
BEGIN;
SELECT id FROM public.videos WHERE id=:'video_id'::uuid FOR UPDATE;
SELECT pg_sleep(1.5);
SELECT public.rubi_manage_video_audited('status', :'video_id'::uuid,
  '{"status":"archived"}'::jsonb, NULL, :'master_id'::uuid);
COMMIT;
SQL
session_a_pid=$!

sleep 0.2
"${psql_base[@]}" -v video_id="$video_id" -v master_id="$RUBI_QA_MASTER_USER_ID" >"$tmp_dir/session-b.log" 2>&1 <<'SQL'
SELECT public.rubi_manage_video_audited('status', :'video_id'::uuid,
  '{"status":"draft"}'::jsonb, NULL, :'master_id'::uuid);
SQL

wait "$session_a_pid"

final_status="$("${psql_base[@]}" -qAt -v video_id="$video_id" <<'SQL'
SELECT status FROM public.videos WHERE id=:'video_id'::uuid;
SQL
)"
if [[ "$final_status" != "draft" ]]; then
  echo "Expected final status draft, got: $final_status" >&2
  cat "$tmp_dir/session-a.log" "$tmp_dir/session-b.log" >&2
  exit 1
fi

status_events="$("${psql_base[@]}" -qAt -v video_id="$video_id" <<'SQL'
SELECT count(*) FROM public.admin_audit_log
WHERE entity_type='video' AND entity_id=:'video_id' AND action_type='RUBI_VIDEO_STATUS_CHANGED';
SQL
)"
if [[ "$status_events" != "2" ]]; then
  echo "Expected two status audit events, got: $status_events" >&2
  exit 1
fi

ordered_transitions="$("${psql_base[@]}" -qAt -v video_id="$video_id" <<'SQL'
SELECT count(*) FILTER (WHERE previous_value->>'status'='draft' AND new_value->>'status'='archived')::text
  || ':' ||
  count(*) FILTER (WHERE previous_value->>'status'='archived' AND new_value->>'status'='draft')::text
FROM public.admin_audit_log
WHERE entity_type='video' AND entity_id=:'video_id' AND action_type='RUBI_VIDEO_STATUS_CHANGED';
SQL
)"
if [[ "$ordered_transitions" != "1:1" ]]; then
  echo "Expected both serialized transitions in audit history, got: $ordered_transitions" >&2
  exit 1
fi

echo "PASS: concurrent audited video status transitions serialize under row lock and preserve both audit events."
