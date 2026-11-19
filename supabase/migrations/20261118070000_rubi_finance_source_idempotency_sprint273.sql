-- Sprint 273: enforce source-level idempotency for canonical finance records.
-- Provider identity participates in the key because external event/order IDs may only
-- be unique within one provider. COALESCE gives NULL-provider internal sources a stable namespace.
-- This migration is additive and performs no backfill or DML.

create unique index rubi_finance_obligations_source_identity_uidx
  on public.rubi_finance_obligations(
    source_kind,
    source_id,
    obligation_type,
    scope_type,
    coalesce(provider_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where source_id is not null;

create unique index rubi_finance_entries_source_identity_uidx
  on public.rubi_finance_entries(
    source_kind,
    source_id,
    entry_type,
    direction,
    coalesce(provider_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where source_id is not null;

comment on index public.rubi_finance_obligations_source_identity_uidx is
  'Prevents duplicate expected obligations for the same source, obligation type, scope and provider. Partner sale adapters use source_kind=partner_sale and source_id=hub_partner_confirmed_sales.id.';

comment on index public.rubi_finance_entries_source_identity_uidx is
  'Prevents duplicate canonical entries for the same source, entry type, direction and provider. Provider event identifiers are scoped to their provider.';
