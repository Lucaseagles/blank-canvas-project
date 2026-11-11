-- Variants are private editorial drafts. They cannot change prices, payment links or orders.
create table if not exists public.rubi_movement_variants (
 id uuid primary key default gen_random_uuid(),
 movement_id uuid not null references public.rubi_movements(id) on delete cascade,
 name text not null check (char_length(btrim(name)) between 3 and 120),
 format text not null check (format in ('short_video','story','carousel','post')),
 creative_hook text not null default '' check (char_length(creative_hook)<=280),
 creative_script text not null default '' check (char_length(creative_script)<=2500),
 page_headline text not null default '' check (char_length(page_headline)<=240),
 page_body text not null default '' check (char_length(page_body)<=4000),
 call_to_action text not null default '' check (char_length(call_to_action)<=120),
 media_notes text not null default '' check (char_length(media_notes)<=1200),
 proof_notes text not null default '' check (char_length(proof_notes)<=1200),
 media_rights_confirmed boolean not null default false,
 status text not null default 'draft' check (status in ('draft','review')),
 revision integer not null default 1 check (revision>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists rubi_movement_variants_movement_idx on public.rubi_movement_variants(movement_id,updated_at desc);
alter table public.rubi_movement_variants enable row level security;
revoke all on public.rubi_movement_variants from public,anon,authenticated;
comment on table public.rubi_movement_variants is 'Private editorial creative + landing page variants. No public deployment or external checkout interaction.';
