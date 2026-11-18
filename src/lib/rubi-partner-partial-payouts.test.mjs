import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
test("partial payout migration removes sale uniqueness and caps installments atomically", () => {
 const sql=read("../../supabase/migrations/20261118040000_rubi_partner_partial_payouts.sql");
 assert.match(sql,/drop constraint if exists hub_partner_commission_payout_items_sale_id_key/i);
 assert.match(sql,/for update of s/i);
 assert.match(sql,/sum\(i\.commission_amount\)/i);
 assert.match(sql,/v_amount>v_commission-v_paid/i);
 assert.match(sql,/insert into public\.hub_partner_commission_payouts[\s\S]*insert into public\.hub_partner_commission_payout_items[\s\S]*insert into public\.admin_audit_log/);
 assert.match(sql,/RUBI_PARTNER_COMMISSION_PAYOUT_SETTLED/);
 assert.match(sql,/grant execute on function public\.hub_settle_partner_commissions\(uuid,jsonb,text,timestamptz,text,uuid\)\s*to service_role/i);
});
test("admin server function calculates outstanding balance and submits explicit allocations", () => {
 const server=read("./partner-payout-settlement-admin.functions.ts");
 assert.match(server,/remaining_amount/);
 assert.match(server,/p_allocations: data\.allocations/);
 assert.match(server,/amount: z\.number\(\)\.positive\(\)/);
 assert.match(server,/requireOwnerRole/);
});
test("Master UI exposes per-sale installment bounded by remaining balance", () => {
 const ui=read("../routes/admin/partner-payouts.tsx");
 assert.match(ui,/max=\{sale\.remaining_amount\}/);
 assert.match(ui,/remaining_amount/);
 assert.match(ui,/allocations:/);
 assert.match(ui,/payment_verified: true/);
});
