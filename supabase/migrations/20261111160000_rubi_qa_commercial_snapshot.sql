-- An attestation applies only to the commercial terms in effect when reviewed.
alter table public.rubi_launch_qa_checklists
 add column if not exists commercial_snapshot text;
comment on column public.rubi_launch_qa_checklists.commercial_snapshot is
 'Canonical snapshot of product and supplier commercial fields at the last manual QA approval; NULL is stale.';
