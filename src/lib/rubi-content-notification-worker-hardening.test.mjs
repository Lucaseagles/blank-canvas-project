import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL(
  "../../supabase/migrations/20261124120000_sprint306_harden_content_notification_queue_temp_table.sql",
  import.meta.url
), "utf8");

test("content notification SECURITY DEFINER worker cannot be shadowed by caller temp tables", () => {
  const start = migration.indexOf("CREATE OR REPLACE FUNCTION public.process_content_notification_queue");
  assert.notEqual(start, -1);
  const end = migration.indexOf("$function$;", start);
  assert.notEqual(end, -1);
  const definition = migration.slice(start, end);

  assert.match(definition, /SECURITY DEFINER/i);
  assert.match(definition, /SET search_path\s*=\s*''/i);
  assert.doesNotMatch(definition, /CREATE\s+TEMP(?:ORARY)?\s+TABLE/i);
  assert.doesNotMatch(definition, /TRUNCATE\s+tmp_content_affinity/i);
  assert.match(definition, /FROM public\.calculate_content_affinity\(/i);
  assert.match(definition, /INSERT INTO public\.content_affinity_log/i);
  assert.match(definition, /INSERT INTO public\.notifications/i);
});

test("content notification worker remains service-role-only", () => {
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.process_content_notification_queue\(integer\)\s+FROM PUBLIC, anon, authenticated/i);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.process_content_notification_queue\(integer\)\s+TO service_role/i);
});
