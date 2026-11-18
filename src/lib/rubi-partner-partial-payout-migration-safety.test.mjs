import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql=readFileSync(new URL("../../supabase/migrations/20261118040000_rubi_partner_partial_payouts.sql",import.meta.url),"utf8");
test("partial payout migration retains historical payout records",()=>{
 assert.match(sql,/drop constraint if exists hub_partner_commission_payout_items_sale_id_key/i);
 assert.doesNotMatch(sql,/delete from public\.hub_partner_commission_payout/);
 assert.doesNotMatch(sql,/truncate/i);
 assert.match(sql,/drop function if exists public\.hub_settle_partner_commissions/);
 assert.match(sql,/Owner authorization required/);
});
test("partial payout RPC is callable only by service role and validates the trusted Owner actor",()=>{
 assert.match(sql,/security definer[\s\S]*set search_path=''/i);
 assert.match(sql,/revoke all on function public\.hub_settle_partner_commissions[\s\S]*from public,anon,authenticated/i);
 assert.match(sql,/grant execute on function public\.hub_settle_partner_commissions\(uuid,jsonb,text,timestamptz,text,uuid\)\s*to service_role/i);
 assert.match(sql,/from public\.user_roles r where r\.user_id=p_actor and r\.role='owner'/i);
});
test("invalid or inconsistent commission balances are rejected before payout inserts",()=>{
 assert.match(sql,/v_commission is null or v_commission<=0/i);
 assert.match(sql,/v_paid<0 or v_paid>v_commission/i);
 assert.match(sql,/v_amount>v_commission-v_paid/i);
 assert.match(sql,/for update of s/i);
});
