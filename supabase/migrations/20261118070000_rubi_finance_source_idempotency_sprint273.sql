-- Sprint 273: enforce source-level idempotency for canonical finance records.
-- This migration is intentionally additive. It does not import or rewrite legacy records.
-- Run only after the ordered finance migration chain has passed disposable-DB validation.

create unique index rubi_finance_obligations_source_identity_uidx
  on public.rubi_finance_obligations(source_kind, source_id, obligation_type, scope_type)
  where source_id is not null;

create unique index rubi_finance_entries_source_identity_uidx
  on public.rubi_finance_entries(source_kind, source_id, entry_type, direction)
  where source_id is not null;

comment on index public.rubi_finance_obligations_source_identity_uidx is
  'Prevents duplicate expected obligations for the same canonical source, obligation type and scope. Partner sale adapters should use source_kind=partner_sale and source_id=hub_partner_confirmed_sales.id.';

comment on index public.rubi_finance_entries_source_identity_uidx is
  'Prevents duplicate canonical entries for the same source identity, entry type and direction. Provider/import adapters must use stable immutable source identifiers.';
