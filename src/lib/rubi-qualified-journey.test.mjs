import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Journey requires sequential click, view and checkout in same session within 30 minutes",()=>{
 const sql=read("../../supabase/migrations/20261111150000_rubi_editorial_session_journey.sql");
 assert.match(sql,/min\(e\.created_at\) as first_click/);
 assert.match(sql,/e\.session_id=c\.session_id/);
 assert.match(sql,/e\.created_at>=c\.first_click/);
 assert.match(sql,/e\.created_at>=v\.first_view/);
 assert.match(sql,/interval '30 minutes'/);
 assert.match(sql,/has_partner_referral'='false'/);
});
test("Only service_role can request aggregated journeys, no session IDs returned",()=>{
 const sql=read("../../supabase/migrations/20261111150000_rubi_editorial_session_journey.sql");
 assert.match(sql,/revoke all on function public\.rubi_editorial_session_journey\(integer\) from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.rubi_editorial_session_journey\(integer\) to service_role/);
 assert.match(sql,/returns table\(section_id uuid, product_id uuid/);
 assert.doesNotMatch(sql,/returns table\([^)]*session_id/);
 const server=read("./rubi-editorial-metrics.functions.ts");
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/rubi_editorial_session_journey/);
});
test("Dashboard labels raw events separately from qualified sessions",()=>{
 const view=read("../components/store/RubiEditorialMetricsAdmin.tsx");
 assert.match(view,/qualifiedClickedSessions/);
 assert.match(view,/qualifiedViewedSessions/);
 assert.match(view,/qualifiedCheckoutSessions/);
});
