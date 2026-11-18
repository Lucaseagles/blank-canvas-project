-- Sprint 252: canonical multi-provider financial domain.
-- No provider credentials or raw webhook payloads are stored in these tables.
-- Existing partner commission/payout tables remain the specialized historical sub-ledger.

create table public.rubi_finance_providers (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique check (provider_key ~ '^[a-z0-9][a-z0-9_-]{1,79}$'),
  display_name text not null check (length(btrim(display_name)) between 2 and 120),
  provider_type text not null check (provider_type in ('gateway','marketplace','supplier','bank','manual','other')),
  environment text not null default 'unknown' check (environment in ('production','sandbox','unknown')),
  connection_status text not null default 'not_configured' check (connection_status in ('not_configured','manual_only','disconnected','pending_review','connected','degraded','disabled')),
  capabilities jsonb not null default '{}'::jsonb check (jsonb_typeof(capabilities)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rubi_finance_accounts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.rubi_finance_providers(id) on delete restrict,
  account_key text not null check (length(btrim(account_key)) between 1 and 120),
  label text not null check (length(btrim(label)) between 1 and 120),
  external_account_ref text,
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_id, account_key)
);

create table public.rubi_finance_import_batches (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.rubi_finance_providers(id) on delete restrict,
  import_kind text not null check (import_kind in ('orders','settlements','fees','refunds','chargebacks','supplier_bills','bank_statement','other')),
  source_filename text,
  file_checksum text check (file_checksum is null or file_checksum ~ '^[a-fA-F0-9]{64}$'),
  status text not null default 'staged' check (status in ('staged','validating','ready','processing','completed','completed_with_errors','rejected','failed')),
  total_rows integer not null default 0 check (total_rows >= 0),
  accepted_rows integer not null default 0 check (accepted_rows >= 0),
  rejected_rows integer not null default 0 check (rejected_rows >= 0),
  duplicate_rows integer not null default 0 check (duplicate_rows >= 0),
  initiated_by uuid references auth.users(id) on delete set null,
  error_summary jsonb not null default '[]'::jsonb check (jsonb_typeof(error_summary)='array'),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (accepted_rows + rejected_rows + duplicate_rows <= total_rows)
);

create unique index rubi_finance_import_provider_checksum_uidx
  on public.rubi_finance_import_batches(provider_id, file_checksum)
  where file_checksum is not null;

create table public.rubi_finance_documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.rubi_finance_providers(id) on delete restrict,
  import_batch_id uuid references public.rubi_finance_import_batches(id) on delete restrict,
  document_type text not null check (document_type in ('provider_statement','settlement_report','invoice','refund_report','chargeback_report','manual_evidence','other')),
  storage_bucket text not null default 'private-finance-evidence',
  storage_path text not null check (length(btrim(storage_path)) between 1 and 500),
  file_checksum text check (file_checksum is null or file_checksum ~ '^[a-fA-F0-9]{64}$'),
  mime_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  evidence_status text not null default 'attached' check (evidence_status in ('attached','reviewed','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(storage_bucket, storage_path)
);

create table public.rubi_finance_events (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.rubi_finance_providers(id) on delete restrict,
  import_batch_id uuid references public.rubi_finance_import_batches(id) on delete restrict,
  document_id uuid references public.rubi_finance_documents(id) on delete restrict,
  external_event_id text,
  external_order_ref text,
  external_transaction_ref text,
  event_type text not null check (event_type in ('order_created','payment_pending','payment_authorized','payment_captured','settlement','fee','refund','chargeback','payout','adjustment','unknown')),
  original_status text,
  canonical_status text not null default 'unknown' check (canonical_status in ('observed','pending','authorized','captured','settled','failed','refunded','partially_refunded','disputed','chargeback','reversed','unknown')),
  processing_status text not null default 'received' check (processing_status in ('received','validated','duplicate','rejected','needs_review','processed','failed')),
  amount numeric(18,2) check (amount is null or amount >= 0),
  currency char(3) check (currency is null or currency ~ '^[A-Z]{3}$'),
  occurred_at timestamptz,
  received_at timestamptz not null default now(),
  payload_hash text not null check (payload_hash ~ '^[a-fA-F0-9]{64}$'),
  safe_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_metadata)='object'),
  processed_at timestamptz,
  error_code text
);

create unique index rubi_finance_events_provider_external_id_uidx
  on public.rubi_finance_events(provider_id, external_event_id)
  where external_event_id is not null;
create unique index rubi_finance_events_provider_hash_without_id_uidx
  on public.rubi_finance_events(provider_id, payload_hash)
  where external_event_id is null;

create index rubi_finance_events_processing_idx
  on public.rubi_finance_events(processing_status, received_at desc);
create index rubi_finance_events_order_ref_idx
  on public.rubi_finance_events(provider_id, external_order_ref)
  where external_order_ref is not null;

create table public.rubi_finance_obligations (
  id uuid primary key default gen_random_uuid(),
  obligation_type text not null check (obligation_type in ('receivable','payable','partner_commission','supplier_bill','fee','refund')),
  scope_type text not null check (scope_type in ('rubi','partner','merchant','supplier')),
  partner_profile_id uuid references public.commercial_profiles(id) on delete restrict,
  provider_id uuid references public.rubi_finance_providers(id) on delete restrict,
  source_kind text not null check (source_kind in ('store_order','marketplace_order','partner_sale','supplier_invoice','provider_fee','refund','manual','other')),
  source_id text,
  external_reference text,
  description text not null check (length(btrim(description)) between 2 and 240),
  expected_amount numeric(18,2) not null check (expected_amount > 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  due_at timestamptz,
  status text not null default 'open' check (status in ('forecast','open','partially_settled','settled','overdue','cancelled','disputed')),
  agreement_revision integer,
  commission_base numeric(18,2),
  commission_rate numeric(9,4),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope_type='partner') = (partner_profile_id is not null)),
  check (commission_base is null or commission_base >= 0),
  check (commission_rate is null or commission_rate between 0 and 100)
);

create index rubi_finance_obligations_status_due_idx
  on public.rubi_finance_obligations(status, due_at);
create index rubi_finance_obligations_partner_idx
  on public.rubi_finance_obligations(partner_profile_id, created_at desc)
  where partner_profile_id is not null;

create table public.rubi_finance_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('sale_receipt','marketplace_settlement','partner_commission','partner_payout','supplier_payment','provider_fee','refund','chargeback','adjustment','transfer','other')),
  direction text not null check (direction in ('inflow','outflow')),
  amount numeric(18,2) not null check (amount > 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  entry_status text not null default 'posted' check (entry_status in ('posted','reversed')),
  effective_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  source_kind text not null check (source_kind in ('provider_event','import','manual_owner','partner_subledger','internal','other')),
  source_id text,
  provider_id uuid references public.rubi_finance_providers(id) on delete restrict,
  external_reference text,
  partner_profile_id uuid references public.commercial_profiles(id) on delete restrict,
  document_id uuid references public.rubi_finance_documents(id) on delete restrict,
  verification_method text not null check (verification_method in ('provider_webhook','provider_api','provider_import','manual_owner','legacy_subledger','internal')),
  verification_reference text,
  reversal_of_entry_id uuid references public.rubi_finance_entries(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null,
  safe_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_metadata)='object'),
  check (reversal_of_entry_id is null or reversal_of_entry_id <> id)
);

create unique index rubi_finance_entries_single_reversal_uidx
  on public.rubi_finance_entries(reversal_of_entry_id)
  where reversal_of_entry_id is not null;
create index rubi_finance_entries_effective_idx on public.rubi_finance_entries(effective_at desc);
create index rubi_finance_entries_provider_ref_idx on public.rubi_finance_entries(provider_id, external_reference)
  where provider_id is not null and external_reference is not null;
create index rubi_finance_entries_partner_idx on public.rubi_finance_entries(partner_profile_id, effective_at desc)
  where partner_profile_id is not null;

create table public.rubi_finance_allocations (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.rubi_finance_entries(id) on delete restrict,
  obligation_id uuid not null references public.rubi_finance_obligations(id) on delete restrict,
  allocated_amount numeric(18,2) not null check (allocated_amount > 0),
  created_at timestamptz not null default now(),
  unique(entry_id, obligation_id)
);

create index rubi_finance_allocations_obligation_idx
  on public.rubi_finance_allocations(obligation_id);

create table public.rubi_finance_reconciliation_matches (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references public.rubi_finance_obligations(id) on delete restrict,
  finance_event_id uuid references public.rubi_finance_events(id) on delete restrict,
  entry_id uuid references public.rubi_finance_entries(id) on delete restrict,
  match_method text not null check (match_method in ('automatic_exact_reference','automatic_strong_match','manual_owner')),
  match_status text not null default 'suggested' check (match_status in ('suggested','matched','discrepancy','ignored_with_reason','reversed')),
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  discrepancy_reason text,
  matched_by uuid references auth.users(id) on delete set null,
  matched_at timestamptz,
  created_at timestamptz not null default now(),
  check (finance_event_id is not null or entry_id is not null),
  check (match_status <> 'matched' or matched_at is not null)
);

create unique index rubi_finance_reconciliation_event_uidx
  on public.rubi_finance_reconciliation_matches(obligation_id, finance_event_id)
  where finance_event_id is not null;
create unique index rubi_finance_reconciliation_entry_uidx
  on public.rubi_finance_reconciliation_matches(obligation_id, entry_id)
  where entry_id is not null;

-- Canonical entries are append-only. Corrections and refunds use compensating entries.
create or replace function public.rubi_finance_reject_entry_mutation()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
begin
  raise exception 'Financial entries and allocations are immutable; create a compensating entry instead';
end;
$$;

create trigger rubi_finance_entries_immutable
before update or delete on public.rubi_finance_entries
for each row execute function public.rubi_finance_reject_entry_mutation();

create trigger rubi_finance_allocations_immutable
before update or delete on public.rubi_finance_allocations
for each row execute function public.rubi_finance_reject_entry_mutation();

revoke all on function public.rubi_finance_reject_entry_mutation() from public, anon, authenticated;
grant execute on function public.rubi_finance_reject_entry_mutation() to service_role;

-- All financial tables are private to the Owner through authenticated reads.
-- Writes are server-side only through the service role and audited server functions.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'rubi_finance_providers','rubi_finance_accounts','rubi_finance_import_batches',
    'rubi_finance_documents','rubi_finance_events','rubi_finance_obligations',
    'rubi_finance_entries','rubi_finance_allocations','rubi_finance_reconciliation_matches'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    if table_name in ('rubi_finance_entries','rubi_finance_allocations') then
      execute format('grant select, insert on public.%I to service_role', table_name);
    else
      execute format('grant select, insert, update on public.%I to service_role', table_name);
    end if;
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_role((select auth.uid()), ''owner''::public.app_role))',
      table_name || '_owner_select', table_name
    );
  end loop;
end;
$$;

comment on table public.rubi_finance_providers is 'External finance source registry; credentials must remain in server-side secret storage.';
comment on table public.rubi_finance_events is 'Normalized provider event inbox; stores hashes and safe metadata, never raw provider payloads.';
comment on table public.rubi_finance_obligations is 'Expected receivables/payables; forecast is not cash received.';
comment on table public.rubi_finance_entries is 'Append-only financial cash movements; reversals are compensating entries.';
comment on table public.rubi_finance_allocations is 'Partial settlement allocations; over-allocation must be prevented by transactional RPC.';
comment on table public.rubi_finance_reconciliation_matches is 'Auditable matches between internal obligations and external evidence.';
