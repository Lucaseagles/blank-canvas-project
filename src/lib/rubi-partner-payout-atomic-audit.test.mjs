import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("partner commission settlement requires Owner actor and audits payout atomically", () => {
 const sql=read("../../supabase/migrations/20261118030000_rubi_partner_payout_atomic_audit.sql");
 const server=read("./partner-payout-settlement-admin.functions.ts");
 assert.match(sql,/revoke all on function public\.hub_settle_partner_commissions\(uuid,uuid\[\],text,timestamptz,text\)[\s\S]*from public,anon,authenticated,service_role/i);
 assert.match(sql,/create or replace function public\.hub_settle_partner_commissions\([\s\S]*p_actor uuid[\s\S]*security definer/i);
 assert.match(sql,/auth\.role\(\)\s*<>\s*'service_role'/);
 assert.match(sql,/user_roles[\s\S]*role='owner'/);
 assert.match(sql,/order by s\.id for update of s/i);
 assert.match(sql,/already settled/i);
 assert.match(sql,/insert into public\.hub_partner_commission_payouts[\s\S]*insert into public\.hub_partner_commission_payout_items[\s\S]*insert into public\.admin_audit_log/);
 assert.match(sql,/RUBI_PARTNER_COMMISSION_PAYOUT_SETTLED/);
 assert.match(sql,/actor_user_id,actor_email,action_type/);
 assert.match(sql,/sales_count/);
 assert.doesNotMatch(sql,/payment_reference',\s*btrim\(p_payment_reference\)/);
 assert.match(sql,/grant execute on function public\.hub_settle_partner_commissions\(uuid,uuid\[\],text,timestamptz,text,uuid\)\s*to service_role/i);
 assert.match(server,/requireOwnerRole/);
 assert.match(server,/p_actor:\s*context\.userId/);
});
