import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const migration=readFileSync(new URL("../../supabase/migrations/20261118020000_rubi_editorial_session_journey_uuid_fix.sql",import.meta.url),"utf8");
const canonicalUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test("canonical section UUIDs pass and malformed extra-group UUIDs fail",()=>{
 assert.equal(canonicalUuid.test("9b372b7c-cb0d-4daa-8f1d-8c6eb9f67e05"),true);
 assert.equal(canonicalUuid.test("9b372b7c-cb0d-4daa-8f1d-8c6e-b9f67e05"),false);
});

test("session journey SQL uses the canonical 8-4-4-4-12 UUID shape",()=>{
 assert.match(migration,/section_text ~\* '\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$'/);
 assert.doesNotMatch(migration,/\{8\}-\{4\}-\{4\}-\{4\}-\{4\}-\{12\}/);
});

test("journey still requires same-session ordered stages and server-only execution",()=>{
 assert.match(migration,/e\.session_id=c\.session_id/);
 assert.match(migration,/e\.created_at>=c\.first_click/);
 assert.match(migration,/e\.created_at>=v\.first_view/);
 assert.match(migration,/interval '30 minutes'/);
 assert.match(migration,/revoke all on function public\.rubi_editorial_session_journey\(integer\) from public,anon,authenticated/);
 assert.match(migration,/grant execute on function public\.rubi_editorial_session_journey\(integer\) to service_role/);
 assert.doesNotMatch(migration,/returns table\([^)]*session_id/);
});
