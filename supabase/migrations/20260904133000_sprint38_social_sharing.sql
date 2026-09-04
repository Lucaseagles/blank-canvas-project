-- Sprint 38 — Social Sharing
-- Safe/idempotent migration for referral share templates, card configuration and analytics.

create table if not exists public.share_templates (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique check (platform in ('tiktok','instagram','kwai','telegram','whatsapp')),
  caption_template text not null,
  max_length integer not null default 280 check (max_length > 0 and max_length <= 4000),
  hashtags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.share_card_config (
  id uuid primary key default gen_random_uuid(),
  config_key text not null unique,
  config_value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.share_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  referral_code text not null,
  platform text not null check (platform in ('tiktok','instagram','kwai','telegram','whatsapp')),
  format text not null check (format in ('9_16','1_1')),
  shared_at timestamptz not null default now()
);

create index if not exists idx_share_templates_platform_s38 on public.share_templates(platform);
create index if not exists idx_share_history_user_s38 on public.share_history(user_id);
create index if not exists idx_share_history_platform_s38 on public.share_history(platform);
create index if not exists idx_share_history_shared_at_s38 on public.share_history(shared_at desc);

alter table public.share_templates enable row level security;
alter table public.share_card_config enable row level security;
alter table public.share_history enable row level security;

-- Remove permissive policies from earlier drafts, if they exist.
drop policy if exists "Enable all for authenticated users" on public.share_templates;
drop policy if exists "Enable all for authenticated users" on public.share_card_config;
drop policy if exists "Enable insert for authenticated users" on public.share_history;
drop policy if exists "Enable select for authenticated users" on public.share_history;
drop policy if exists share_templates_public_read_s38 on public.share_templates;
drop policy if exists share_templates_owner_write_s38 on public.share_templates;
drop policy if exists share_card_config_authenticated_read_s38 on public.share_card_config;
drop policy if exists share_card_config_owner_write_s38 on public.share_card_config;
drop policy if exists share_history_owner_insert_s38 on public.share_history;
drop policy if exists share_history_owner_select_s38 on public.share_history;

create policy share_templates_public_read_s38
on public.share_templates
for select
to anon, authenticated
using (is_active = true);

create policy share_templates_owner_write_s38
on public.share_templates
for all
to authenticated
using (public.has_role((select auth.uid()), 'owner'))
with check (public.has_role((select auth.uid()), 'owner'));

create policy share_card_config_authenticated_read_s38
on public.share_card_config
for select
to authenticated
using (true);

create policy share_card_config_owner_write_s38
on public.share_card_config
for all
to authenticated
using (public.has_role((select auth.uid()), 'owner'))
with check (public.has_role((select auth.uid()), 'owner'));

create policy share_history_owner_insert_s38
on public.share_history
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy share_history_owner_select_s38
on public.share_history
for select
to authenticated
using ((select auth.uid()) = user_id or public.has_role((select auth.uid()), 'owner'));

grant select on public.share_templates to anon, authenticated;
grant select, insert, update, delete on public.share_templates to authenticated;
grant select on public.share_card_config to authenticated;
grant update, delete, insert on public.share_card_config to authenticated;
grant select, insert on public.share_history to authenticated;

insert into public.share_templates (platform, caption_template, max_length, hashtags, is_active)
values
('tiktok', E'🎁 Ganhe recompensas exclusivas com meu código de indicação!\n\nBaixe o app e use o código: {code}\n\n{link}\n\n#indicacao #recompensas #app', 280, array['indicacao','recompensas','app'], true),
('instagram', E'✨ Descubra recompensas incríveis usando meu código de indicação!\n\n{emoji} Use o código: {code}\n🔗 Link: {link}\n\nGanhe {reward} e aproveite ofertas exclusivas!', 280, array['indicacao','recompensas','app','ofertas'], true),
('kwai', E'🎁 Ganhe presentes usando meu código!\nCódigo: {code}\n{link}\n\n#indicacao #recompensas', 280, array['indicacao','recompensas'], true),
('telegram', E'🎁 Use meu código de indicação e ganhe recompensas!\n\nCódigo: {code}\nLink: {link}\n\nAproveite! 💰', 4096, array['indicacao','recompensas'], true),
('whatsapp', E'🎁 Olá! Use meu código de indicação e ganhe {reward}:\n\nCódigo: {code}\nLink: {link}\n\nVem comigo! 🚀', 2000, array['indicacao','recompensas'], true)
on conflict (platform) do update set
  caption_template = excluded.caption_template,
  max_length = excluded.max_length,
  hashtags = excluded.hashtags,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.share_card_config (config_key, config_value)
values
('card_style', '{"primary_color":"#6366F1","secondary_color":"#8B5CF6","text_color":"#FFFFFF","background":"#0A0A0F","accent_color":"#FBBF24"}'::jsonb),
('card_texts', '{"title":"Ganhe Recompensas Exclusivas","subtitle":"Use meu código de indicação","cta":"Baixe o app agora","reward_label":"Ganhe {reward} ao se cadastrar"}'::jsonb)
on conflict (config_key) do nothing;
