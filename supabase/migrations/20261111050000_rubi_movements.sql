-- RUBI 11x Movement Engine: private multiple hypotheses per catalog product.
-- No publication, checkout mutation or automatic messaging.
create table if not exists public.rubi_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.hub_products(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 120),
  audience text not null check (audience in ('consumer','merchant','partner')),
  buyer_persona text not null default '' check (char_length(buyer_persona)<=400),
  problem text not null default '' check (char_length(problem)<=700),
  desired_outcome text not null default '' check (char_length(desired_outcome)<=700),
  truthful_promise text not null default '' check (char_length(truthful_promise)<=500),
  differentiator text not null default '' check (char_length(differentiator)<=800),
  narrative text not null default '' check (char_length(narrative)<=1800),
  evidence_notes text not null default '' check (char_length(evidence_notes)<=1400),
  status text not null default 'draft' check (status in ('draft','review')),
  revision integer not null default 1 check (revision>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rubi_movements_product_idx on public.rubi_movements (product_id,updated_at desc);
alter table public.rubi_movements enable row level security;
revoke all on public.rubi_movements from public,anon,authenticated;
comment on table public.rubi_movements is 'Private owner-only movement drafts; audience hypotheses are not consumer profiles, published ads or verified conversions.';
