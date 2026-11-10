-- RUBI Offer Engine MVP: private planning workspaces per catalog product.
-- Never overwrites product price, checkout URL or payment state.
create table if not exists public.rubi_offer_playbooks (
  product_id uuid primary key references public.hub_products(id) on delete cascade,
  audience text not null default 'consumer' check (audience in ('consumer','merchant','partner')),
  promise text not null default '',
  verified_benefits text not null default '',
  proof_notes text not null default '',
  creative_hook text not null default '',
  creative_script text not null default '',
  page_headline text not null default '',
  page_body text not null default '',
  objections text not null default '',
  movement_plan text not null default '',
  channels text[] not null default '{}',
  stage text not null default 'draft' check (stage in ('draft','ready_for_review')),
  updated_at timestamptz not null default now(),
  constraint rubi_offer_playbooks_text_limits check (
    length(promise) <= 400 and length(verified_benefits) <= 2000
    and length(proof_notes) <= 1500 and length(creative_hook) <= 280
    and length(creative_script) <= 2000 and length(page_headline) <= 240
    and length(page_body) <= 4000 and length(objections) <= 1800
    and length(movement_plan) <= 3000 and cardinality(channels) <= 8
    and channels <@ array['instagram','tiktok','rubi_feed','whatsapp','telegram','partners','organic_pages','email']::text[]
  )
);
alter table public.rubi_offer_playbooks enable row level security;
revoke all on public.rubi_offer_playbooks from public, anon, authenticated;
comment on table public.rubi_offer_playbooks is 'Private master-only editorial drafts; no automatic publishing, messaging or checkout changes.';
