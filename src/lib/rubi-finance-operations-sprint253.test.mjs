import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const sql = read("../../supabase/migrations/20261118060000_rubi_finance_atomic_operations_sprint253.sql");
const server = read("./rubi-finance-operations-admin.functions.ts");

test("allocation reversal metadata is append-only and uniquely linked", () => {
  assert.match(sql, /allocation_kind text not null default 'settlement'/);
  assert.match(sql, /reverses_allocation_id uuid\\s+references public\\.rubi_finance_allocations/);
  assert.match(sql, /rubi_finance_allocations_single_reversal_uidx/);
  assert.match(sql, /rubi_finance_allocations_reversal_shape_check/);
});

test("allocation RPC requires service role and Owner actor", () => {
  assert.match(sql, /create or replace function public\.rubi_finance_allocate_entry/);
  assert.match(sql, /auth\.role\(\) is distinct from 'service_role'/);
  assert.match(sql, /user_roles r where r\.user_id=p_actor and r\.role::text='owner'/);
  assert.match(sql, /revoke all on function public\.rubi_finance_allocate_entry[\s\S]*from public,anon,authenticated/);
  assert.match(sql, /grant execute on function public\.rubi_finance_allocate_entry\(uuid,uuid,numeric,uuid,text\)\s*to service_role/i);
});

test("allocation locks both sides, validates direction/currency and caps both balances", () => {
  assert.match(sql, /from public\.rubi_finance_entries[\s\S]*for update/);
  assert.match(sql, /from public\.rubi_finance_obligations[\s\S]*for update/);
  assert.match(sql, /v_entry\.currency<>v_obligation\.currency/);
  assert.match(sql, /v_entry\.direction<>v_expected_direction/);
  assert.match(sql, /v_entry_allocated\+p_amount>v_entry\.amount/);
  assert.match(sql, /v_obligation_settled\+p_amount>v_obligation\.expected_amount/);
  assert.match(sql, /insert into public\.admin_audit_log/);
  assert.match(sql, /RUBI_FINANCE_ALLOCATION_CREATED/);
});

test("reversal is a compensating ledger entry and never claims to reverse provider funds", () => {
  assert.match(sql, /create or replace function public\.rubi_finance_reverse_entry/);
  assert.match(sql, /reversal_of_entry_id=v_original\.id/);
  assert.match(sql, /case when v_original\.direction='inflow' then 'outflow' else 'inflow' end/);
  assert.match(sql, /allocation_kind,reverses_allocation_id/);
  assert.match(sql, /'reversal',v_allocation\.id,p_actor/);
  assert.match(sql, /RUBI_FINANCE_ENTRY_REVERSED/);
  assert.match(sql, /ledger_only_reversal/);
  assert.match(sql, /Does not reverse funds at an external provider/);
});

test("reversal RPC is Owner-only, service-role-only, and prevents duplicate reversal", () => {
  assert.match(sql, /A financial entry was already reversed|Financial entry was already reversed/);
  assert.match(sql, /revoke all on function public\.rubi_finance_reverse_entry[\s\S]*from public,anon,authenticated/);
  assert.match(sql, /grant execute on function public\.rubi_finance_reverse_entry\(uuid,timestamptz,text,uuid\)\s*to service_role/i);
});

test("server actions enforce Owner middleware and use the atomic RPCs", () => {
  assert.equal((server.match(/middleware\(\[requireOwnerRole\]\)/g) ?? []).length, 2);
  assert.match(server, /rubi_finance_allocate_entry/);
  assert.match(server, /rubi_finance_reverse_entry/);
  assert.match(server, /p_actor: context\.userId/);
  assert.match(server, /externalProviderActionRequired: true/);
});
