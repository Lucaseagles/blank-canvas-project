-- Human-attested launch readiness for each supplier product, never an automatic payment certification.
create table if not exists public.rubi_launch_qa_checklists (
 product_id uuid primary key references public.hub_products(id) on delete cascade,
 domain_status text not null default 'pending' check(domain_status in ('pending','verified','blocked')),
 domain_evidence text not null default '' check(length(domain_evidence)<=1000),
 desktop_status text not null default 'pending' check(desktop_status in ('pending','verified','blocked')),
 desktop_evidence text not null default '' check(length(desktop_evidence)<=1000),
 mobile_status text not null default 'pending' check(mobile_status in ('pending','verified','blocked')),
 mobile_evidence text not null default '' check(length(mobile_evidence)<=1000),
 supplier_status text not null default 'pending' check(supplier_status in ('pending','verified','blocked')),
 supplier_evidence text not null default '' check(length(supplier_evidence)<=1000),
 terms_status text not null default 'pending' check(terms_status in ('pending','verified','blocked')),
 terms_evidence text not null default '' check(length(terms_evidence)<=1000),
 updated_at timestamptz not null default now(),
 constraint rubi_launch_qa_evidence_required check (
   (domain_status <> 'verified' or length(btrim(domain_evidence)) >= 8)
   and (desktop_status <> 'verified' or length(btrim(desktop_evidence)) >= 8)
   and (mobile_status <> 'verified' or length(btrim(mobile_evidence)) >= 8)
   and (supplier_status <> 'verified' or length(btrim(supplier_evidence)) >= 8)
   and (terms_status <> 'verified' or length(btrim(terms_evidence)) >= 8)
 )
);
alter table public.rubi_launch_qa_checklists enable row level security;
revoke all on public.rubi_launch_qa_checklists from public,anon,authenticated;
comment on table public.rubi_launch_qa_checklists is 'Private owner-entered QA attestations; not authoritative evidence of purchases or supplier payouts.';
