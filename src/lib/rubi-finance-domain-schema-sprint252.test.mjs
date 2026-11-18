import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/20261118050000_rubi_financial_domain_core_sprint252.sql", import.meta.url), "utf8");

test("Sprint 252 creates the canonical finance tables", () => {
  for (const table of [
    "rubi_finance_providers", "rubi_finance_accounts", "rubi_finance_import_batches",
    "rubi_finance_documents", "rubi_finance_events", "rubi_finance_obligations",
    "rubi_finance_entries", "rubi_finance_allocations", "rubi_finance_reconciliation_matches",
  ]) assert.ok(sql.includes("create table public." + table), table);
});

test("external events are provider-scoped and idempotent without raw payloads", () => {
  assert.ok(sql.includes("rubi_finance_events_provider_hash_without_id_uidx"));
  assert.ok(sql.includes("where external_event_id is null"));
  assert.ok(sql.includes("unique index rubi_finance_events_provider_external_id_uidx"));
  assert.ok(sql.includes("payload_hash text not null"));
  assert.ok(sql.includes("safe_metadata jsonb not null"));
  assert.doesNotMatch(sql, /raw_payload\s+jsonb/i);
  assert.doesNotMatch(sql, /api_secret|access_token|private_key/i);
});

test("expected obligations are separate from posted cash and use explicit currencies", () => {
  assert.ok(sql.includes("expected_amount numeric(18,2) not null check (expected_amount > 0)"));
  assert.ok(sql.includes("amount numeric(18,2) not null check (amount > 0)"));
  assert.ok(sql.includes("currency char(3) not null check (currency ~ '^[A-Z]{3}$')"));
  assert.ok(sql.includes("check ((scope_type='partner') = (partner_profile_id is not null))"));
});

test("financial entries are append-only and use compensating reversals", () => {
  assert.ok(sql.includes("create trigger rubi_finance_entries_immutable"));
  assert.ok(sql.includes("before update or delete on public.rubi_finance_entries"));
  assert.ok(sql.includes("Financial entries and allocations are immutable; create a compensating entry instead"));
  assert.ok(sql.includes("create trigger rubi_finance_allocations_immutable"));
  assert.ok(sql.includes("reversal_of_entry_id uuid references public.rubi_finance_entries"));
  assert.ok(sql.includes("rubi_finance_entries_single_reversal_uidx"));
});

test("all finance tables enforce Owner-only reads and server-only writes", () => {
  assert.ok(sql.includes("alter table public.%I enable row level security"));
  assert.ok(sql.includes("revoke all on public.%I from anon, authenticated"));
  assert.ok(sql.includes("grant select on public.%I to authenticated"));
  assert.ok(sql.includes("grant select, insert on public.%I to service_role"));
  assert.ok(sql.includes("grant select, insert, update on public.%I to service_role"));
  assert.ok(sql.includes("public.has_role((select auth.uid()), ''owner''::public.app_role)"));
});

test("partial allocations and reconciliation are modeled separately", () => {
  assert.ok(sql.includes("allocated_amount numeric(18,2) not null check (allocated_amount > 0)"));
  assert.ok(sql.includes("create table public.rubi_finance_reconciliation_matches"));
  assert.ok(sql.includes("automatic_exact_reference"));
  assert.ok(sql.includes("automatic_strong_match"));
  assert.ok(sql.includes("manual_owner"));
  assert.ok(sql.includes("check (finance_event_id is not null or entry_id is not null)"));
});
