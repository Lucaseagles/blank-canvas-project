-- Restore the support AI request log before the following migration hardens its RLS policies.
-- The canonical shape is aligned with generated Database types and support-ai usage.
create table if not exists public.support_chat_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  question text not null,
  matched_article_id uuid references public.support_faq(id) on delete set null,
  ai_used boolean not null default false,
  ai_model text,
  ai_confidence double precision,
  confidence_score double precision,
  source text not null default 'faq',
  created_at timestamptz not null default now()
);

create index if not exists idx_support_chat_log_created_at
  on public.support_chat_log (created_at desc);
create index if not exists idx_support_chat_log_user_created
  on public.support_chat_log (user_id, created_at desc);
create index if not exists idx_support_chat_log_unmatched_created
  on public.support_chat_log (created_at desc)
  where matched_article_id is null;

alter table public.support_chat_log enable row level security;

-- Writes are intentionally limited to the following policy migration and service role.
revoke all on public.support_chat_log from public, anon, authenticated;
-- The following migration installs INSERT-only RLS policies for anonymous and
-- authenticated support requests; table privileges must also permit those inserts.
grant insert on public.support_chat_log to anon, authenticated;
grant all on public.support_chat_log to service_role;
