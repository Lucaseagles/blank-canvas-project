import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql=readFileSync(new URL("../../supabase/migrations/20261118040000_rubi_partner_partial_payouts.sql",import.meta.url),"utf8");
test("partial payout migration retains prior payout history and only removes sale-level uniqueness",()=>{
 assert.match(sql,/drop constraint if exists hub_partner_commission_payout_items_sale_id_key/i);
 assert.doesNotMatch(sql,/delete from public\.hub_partner_commission_payout/);
 assert.doesNotMatch(sql,/truncate/i);
 assert.match(sql,/drop function if exists public\.hub_settle_partner_commissions/);
 assert.match(sql,/Owner authorization required/);
});
