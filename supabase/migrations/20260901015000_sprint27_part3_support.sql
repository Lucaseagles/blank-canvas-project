create table if not exists public.support_faq (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(trim(question)) between 1 and 300),
  answer text not null check (char_length(trim(answer)) between 1 and 3000),
  keywords text[] default '{}',
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_faq_active_priority on public.support_faq(is_active, priority desc);

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  resolved boolean not null default false,
  whatsapp_handoff boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_conversations_user_updated on public.support_conversations(user_id, updated_at desc);

alter table public.support_faq enable row level security;
alter table public.support_conversations enable row level security;

grant select on public.support_faq to anon, authenticated;
grant select, insert, update on public.support_conversations to authenticated;

create policy "Active support FAQ is public" on public.support_faq
  for select to anon, authenticated using (is_active = true);

create policy "Users can view own support conversations" on public.support_conversations
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can create own support conversations" on public.support_conversations
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own support conversations" on public.support_conversations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_support_conversation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_support_conversation on public.support_conversations;
create trigger trg_touch_support_conversation
before update on public.support_conversations
for each row execute function public.touch_support_conversation();
