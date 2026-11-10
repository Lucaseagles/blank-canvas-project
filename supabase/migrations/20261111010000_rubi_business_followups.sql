-- RUBI 11x Sprint 67: optional, internal reminders for merchant quotes.
-- These fields do not send notifications, create orders, or trigger external contact.
alter table public.hub_b2b_quote_requests
  add column if not exists followup_opt_in boolean not null default false,
  add column if not exists followup_interval_days smallint,
  add column if not exists followup_due_at timestamptz,
  add column if not exists followup_completed_at timestamptz;

-- Default rows stay opted out. Requiring matching fields prevents accidental
-- admin queue exposure from a partially configured or revoked consent.
alter table public.hub_b2b_quote_requests
  add constraint hub_b2b_quote_followup_consent_consistency
  check (
    (followup_opt_in and followup_interval_days in (14,30,60)
      and followup_due_at is not null)
    or
    (not followup_opt_in and followup_interval_days is null
      and followup_due_at is null and followup_completed_at is null)
  );

create index if not exists hub_b2b_quote_followup_due_idx
  on public.hub_b2b_quote_requests (followup_due_at, created_at)
  where followup_opt_in = true and followup_completed_at is null;

comment on column public.hub_b2b_quote_requests.followup_opt_in is
  'Merchant opted into one internal follow-up suggestion about this quote; no external message is sent automatically.';
comment on column public.hub_b2b_quote_requests.followup_due_at is
  'Internal follow-up date, calculated by the server after merchant opt-in; not recurring billing or a notification schedule.';
comment on column public.hub_b2b_quote_requests.followup_completed_at is
  'Owner marked an internal follow-up task completed; does not assert a message was sent or a sale occurred.';

-- Keep private quote ledger inaccessible directly by consumer/merchant clients.
alter table public.hub_b2b_quote_requests enable row level security;
revoke all on public.hub_b2b_quote_requests from public, anon, authenticated;
