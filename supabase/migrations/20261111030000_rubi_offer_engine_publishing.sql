-- RUBI Offer Engine: manual publication of verified consumer editorial copy.
-- No external checkout URL or payment operation is stored here.
alter table public.rubi_offer_playbooks
  add column if not exists published_at timestamptz;
create index if not exists rubi_offer_playbooks_published_idx
  on public.rubi_offer_playbooks (published_at)
  where published_at is not null;
comment on column public.rubi_offer_playbooks.published_at is
  'Explicit owner approval for consumer-facing editorial copy; edits revoke this approval.';
alter table public.rubi_offer_playbooks enable row level security;
revoke all on public.rubi_offer_playbooks from public, anon, authenticated;
