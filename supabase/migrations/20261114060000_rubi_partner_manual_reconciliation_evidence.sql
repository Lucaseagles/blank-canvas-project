-- Sprint 195: documentary trace for manually reconciled external sales.
-- Existing records are historical; constraint is NOT VALID so they can be reviewed separately.
alter table public.hub_partner_confirmed_sales
  add column if not exists provider_name text,
  add column if not exists payment_evidence_reference text,
  add column if not exists payment_verified_at timestamptz;

alter table public.hub_partner_confirmed_sales
  add constraint hub_partner_manual_evidence_required
  check (
    source <> 'admin_reconciliation'
    or (
      length(btrim(coalesce(provider_name, ''))) between 2 and 100
      and length(btrim(coalesce(payment_evidence_reference, ''))) between 8 and 500
      and payment_verified_at is not null
    )
  ) not valid;

comment on column public.hub_partner_confirmed_sales.payment_evidence_reference is
  'Administrative documentary reference only; not proof of a provider-originated payment event.';
